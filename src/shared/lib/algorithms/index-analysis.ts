/**
 * Heuristic helpers for deciding whether a database column is a reasonable
 * index candidate.
 *
 * This does NOT replace EXPLAIN/query profiling or database-specific guidance.
 * It exists to make the project's indexing reasoning explicit and repeatable.
 */

export type IndexRecommendation =
	'avoid' | 'probably-not' | 'measure' | 'good-candidate' | 'strong-candidate';

export interface AnalyzeIndexInput {
	/** Number of rows in the table / collection. */
	rows: number;

	/** Queries per minute that would actually benefit from this index. */
	queriesPerMinute: number;

	/** Inserts/updates/deletes per minute that would maintain this index. */
	writesPerMinute: number;

	/**
	 * Expected fraction of rows matched by a typical query, from 0 to 1.
	 *
	 * Example:
	 * - unique email in 100,000 rows: ~0.00001
	 * - boolean matching 80% of rows: 0.8
	 *
	 * Provide either selectivity OR distinctValues. If both are provided,
	 * selectivity wins because it is more direct.
	 */
	selectivity?: number;

	/**
	 * Approximate number of distinct values in the indexed column.
	 * If values are roughly uniform, selectivity is estimated as 1/distinctValues.
	 */
	distinctValues?: number;

	/**
	 * Rough cost multiplier for fetching matching table rows after navigating
	 * the index. Defaults to 4. This is a heuristic, not a database constant.
	 */
	rowFetchCostMultiplier?: number;
}

export interface IndexAnalysis {
	rows: number;
	queriesPerMinute: number;
	writesPerMinute: number;
	selectivity: number;
	estimatedMatchesPerQuery: number;
	estimatedScanWorkPerQuery: number;
	estimatedIndexedWorkPerQuery: number;
	estimatedReadBenefitPerMinute: number;
	estimatedWriteMaintenancePerMinute: number;

	/**
	 * Higher means the estimated read benefit dominates index maintenance more.
	 * Negative means the modeled indexed read is worse than scanning.
	 */
	score: number;

	recommendation: IndexRecommendation;
}

function assertFiniteNonNegative(value: number, name: string): void {
	if (!Number.isFinite(value) || value < 0) {
		throw new RangeError(`${name} must be a finite non-negative number`);
	}
}

function resolveSelectivity(input: AnalyzeIndexInput): number {
	if (input.selectivity !== undefined) {
		if (!Number.isFinite(input.selectivity) || input.selectivity < 0 || input.selectivity > 1) {
			throw new RangeError('selectivity must be between 0 and 1');
		}

		return input.selectivity;
	}

	if (input.distinctValues === undefined) {
		throw new TypeError('provide either selectivity or distinctValues');
	}

	if (!Number.isFinite(input.distinctValues) || input.distinctValues <= 0) {
		throw new RangeError('distinctValues must be a finite positive number');
	}

	// Assumes values are distributed roughly uniformly.
	return Math.min(1, 1 / input.distinctValues);
}

function classifyIndex(score: number, readBenefit: number): IndexRecommendation {
	if (readBenefit <= 0 || score < 0) return 'avoid';
	if (score < 1) return 'probably-not';
	if (score < 10) return 'measure';
	if (score < 100) return 'good-candidate';
	return 'strong-candidate';
}

/**
 * Estimate whether a column is a useful database-index candidate.
 *
 * Rough model:
 *
 *   scan cost      ~= rows
 *   index read     ~= log2(rows) + rowFetchCostMultiplier * matchedRows
 *   read benefit   ~= queriesPerMinute * (scan cost - index read)
 *   write overhead ~= writesPerMinute * log2(rows)
 *
 * Project-local score:
 *
 *   score = readBenefit / ((writesPerMinute + 1) * log2(rows))
 *
 * The +1 keeps read-heavy/zero-write workloads finite.
 *
 * This is a heuristic. Always prefer the database's real query plan and
 * measurements when available. Low-cardinality columns, skewed distributions,
 * compound indexes, covering indexes, ordering, range queries, and database
 * internals can all change the real result.
 */
export function analyzeIndex(input: AnalyzeIndexInput): IndexAnalysis {
	const { rows, queriesPerMinute, writesPerMinute, rowFetchCostMultiplier = 4 } = input;

	assertFiniteNonNegative(rows, 'rows');
	assertFiniteNonNegative(queriesPerMinute, 'queriesPerMinute');
	assertFiniteNonNegative(writesPerMinute, 'writesPerMinute');
	assertFiniteNonNegative(rowFetchCostMultiplier, 'rowFetchCostMultiplier');

	const selectivity = resolveSelectivity(input);

	// Empty/single-row tables do not benefit meaningfully from logarithmic math.
	const logRows = rows <= 1 ? 1 : Math.log2(rows);
	const estimatedMatchesPerQuery = rows * selectivity;
	const estimatedScanWorkPerQuery = rows;
	const estimatedIndexedWorkPerQuery = logRows + rowFetchCostMultiplier * estimatedMatchesPerQuery;

	const estimatedReadBenefitPerMinute =
		queriesPerMinute * (estimatedScanWorkPerQuery - estimatedIndexedWorkPerQuery);

	const estimatedWriteMaintenancePerMinute = writesPerMinute * logRows;

	const denominator = (writesPerMinute + 1) * logRows;
	const score = denominator === 0 ? 0 : estimatedReadBenefitPerMinute / denominator;

	return {
		rows,
		queriesPerMinute,
		writesPerMinute,
		selectivity,
		estimatedMatchesPerQuery,
		estimatedScanWorkPerQuery,
		estimatedIndexedWorkPerQuery,
		estimatedReadBenefitPerMinute,
		estimatedWriteMaintenancePerMinute,
		score,
		recommendation: classifyIndex(score, estimatedReadBenefitPerMinute)
	};
}
