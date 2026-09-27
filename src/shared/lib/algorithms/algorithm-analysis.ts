import { estimateRepeatedWork, estimateWork, type CommonComplexity } from './complexity';

/**
 * A deliberately rough label for comparing theoretical algorithm pressure.
 *
 * IMPORTANT:
 * These labels describe abstract Big-O work units, not milliseconds, CPU usage,
 * database cost, or a benchmark of the current machine.
 */
export type AlgorithmPressure = 'low' | 'moderate' | 'high' | 'extreme';

export interface AnalyzeAlgorithmInput {
	/** Number of items/rows the operation may need to consider. */
	rows: number;

	/** How often this operation runs. Use the actual hot-path frequency. */
	operationsPerSecond: number;

	/** Big-O class of the algorithm being evaluated. */
	complexity: CommonComplexity;
}

export interface AlgorithmAnalysis {
	rows: number;
	operationsPerSecond: number;
	complexity: CommonComplexity;

	/** Approximate f(n) for one operation. */
	estimatedWorkPerOperation: number;

	/** Approximate operationsPerSecond * f(n). */
	estimatedWorkPerSecond: number;

	/**
	 * Convenience label based only on abstract work units.
	 * Never treat this as a runtime benchmark.
	 */
	pressure: AlgorithmPressure;
}

/**
 * Classify abstract work so repeated comparisons are easy to scan.
 *
 * Thresholds are intentionally broad:
 * - low:      <= 10 thousand work units / second
 * - moderate: <= 1 million
 * - high:     <= 100 million
 * - extreme:  > 100 million
 *
 * These are NOT hardware limits. They are only a consistent project-local
 * heuristic for comparing candidate algorithms before measuring real code.
 */
function classifyPressure(estimatedWorkPerSecond: number): AlgorithmPressure {
	if (estimatedWorkPerSecond <= 10_000) return 'low';
	if (estimatedWorkPerSecond <= 1_000_000) return 'moderate';
	if (estimatedWorkPerSecond <= 100_000_000) return 'high';
	return 'extreme';
}

/**
 * Estimate the theoretical pressure of repeatedly running an algorithm.
 *
 * Formula:
 *
 *   estimated work / second = operationsPerSecond * f(rows)
 *
 * Use this when comparing algorithm choices for data that is ALREADY in
 * memory. Do not use this to justify fetching an entire database table first.
 * Database indexes, bounded queries, pagination, and aggregates belong at the
 * database layer.
 *
 * Example:
 *
 * analyzeAlgorithm({
 *   rows: 1_000_000,
 *   operationsPerSecond: 1_000,
 *   complexity: "O(n)",
 * });
 *
 * -> estimatedWorkPerOperation: 1_000_000
 * -> estimatedWorkPerSecond:    1_000_000_000
 * -> pressure:                  "extreme"
 */
export function analyzeAlgorithm(input: AnalyzeAlgorithmInput): AlgorithmAnalysis {
	const { rows, operationsPerSecond, complexity } = input;

	if (!Number.isFinite(operationsPerSecond) || operationsPerSecond < 0) {
		throw new RangeError('operationsPerSecond must be a finite non-negative number');
	}

	// estimateWork validates rows for us.
	const estimatedWorkPerOperation = estimateWork(rows, complexity);
	const estimatedWorkPerSecond = estimateRepeatedWork(rows, operationsPerSecond, complexity);

	return {
		rows,
		operationsPerSecond,
		complexity,
		estimatedWorkPerOperation,
		estimatedWorkPerSecond,
		pressure: classifyPressure(estimatedWorkPerSecond)
	};
}
