// SVELTEKIT IMPORTS
import { onMount, untrack } from 'svelte';

// LIBRARIES
import type { DateValue } from '@internationalized/date';

// HOOKS
import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';
import { DEFAULT_TIME_RANGE, MAX_RANGE_DAYS } from '@/shared/features/analytics/config.js';
import {
	createAnalyticsDashboardContext,
	useAnalyticsDashboardContext
} from '@/shared/features/analytics/contexts/useAnalyticsDashboardContext.js';

// DATA
import { fetchDummyDashboard, fetchDummyRevenueSeries } from '../data/dummyAnalytics.js';

// UTILS
import { getPreviousRangeBounds } from '@/shared/features/analytics/utils/getPreviousRangeBounds.js';
import {
	DAY_IN_MS,
	daysInRange,
	getStoreDayStart,
	parseIsoDate,
	toIsoDate
} from '@/shared/utils/date.js';

// TYPES
import type {
	AnalyticsScope,
	DashboardComparison,
	PresetTimeRange,
	RangeBounds,
	RevenuePoint,
	TimeRange
} from '@/shared/features/analytics/types/analyticsTypes.js';
import type { DateRange } from 'bits-ui';

export const PRESET_TIME_RANGES: PresetTimeRange[] = ['today', '7d', '30d', '90d'];

type FetchOutcome<T> = { ok: true; value: T } | { ok: false; error: Error };

async function toOutcome<T>(promise: Promise<T>): Promise<FetchOutcome<T>> {
	try {
		return { ok: true, value: await promise };
	} catch (cause) {
		return { ok: false, error: cause instanceof Error ? cause : new Error(String(cause)) };
	}
}

function isPreset(value: string | null): value is PresetTimeRange {
	return PRESET_TIME_RANGES.some((preset) => preset === value);
}

function readCustomRange(get: (key: string) => string | null): DateRange | undefined {
	const start = parseIsoDate(get('from'));
	const end = parseIsoDate(get('to'));
	if (!start || !end || start.compare(end) > 0) return undefined;
	return daysInRange(start, end) <= MAX_RANGE_DAYS ? { start, end } : undefined;
}

function readActiveRange(
	get: (key: string) => string | null,
	customRange: DateRange | undefined
): TimeRange {
	const raw = get('timerange');
	if (raw === 'custom') return customRange ? 'custom' : DEFAULT_TIME_RANGE;
	return isPreset(raw) ? raw : DEFAULT_TIME_RANGE;
}

// The dashboard's day boundaries are the store's, never the viewer's browser zone.
const TIME_ZONE = COMPANY_DATA.TIMEZONE;

function customRangeBounds(range: DateRange): RangeBounds | undefined {
	if (!range.start || !range.end) return undefined;

	const from = getStoreDayStart(range.start.toDate(TIME_ZONE).getTime(), TIME_ZONE);
	const dayAfterEnd = getStoreDayStart(
		range.end.toDate(TIME_ZONE).getTime() + DAY_IN_MS,
		TIME_ZONE
	);
	return { from: new Date(from), to: new Date(dayAfterEnd - 1) };
}

function presetRangeBounds(activeRange: PresetTimeRange): RangeBounds {
	const now = Date.now();
	const offset = activeRange === 'today' ? 0 : Number.parseInt(activeRange) - 1;
	const todayStart = getStoreDayStart(now, TIME_ZONE);

	return {
		from: new Date(getStoreDayStart(todayStart - offset * DAY_IN_MS, TIME_ZONE)),
		to: new Date(now)
	};
}

export class AnalyticsDashboardState {
	#searchParams = useSearchParams(['timerange', 'from', 'to']);
	#requestId = 0;
	#scope: AnalyticsScope;

	constructor(scope: AnalyticsScope) {
		this.#scope = scope;
	}

	customRange = $state<DateRange | undefined>(
		untrack(() => readCustomRange(this.#searchParams.get))
	);
	activeRange = $state<TimeRange>(
		untrack(() => readActiveRange(this.#searchParams.get, this.customRange))
	);
	selectedPreset = $state<string>(
		untrack(() => (isPreset(this.activeRange) ? this.activeRange : ''))
	);

	statsData = $state<DashboardComparison>();
	statsError = $state<Error>();
	statsLoading = $state(true);
	revenueData = $state<RevenuePoint[]>();
	revenueError = $state<Error>();
	revenueLoading = $state(true);

	bounds = $derived.by<RangeBounds>(() => {
		const custom = this.activeRange === 'custom' ? this.customRange : undefined;
		if (custom) {
			const bounds = customRangeBounds(custom);
			if (bounds) return bounds;
		}

		return presetRangeBounds(isPreset(this.activeRange) ? this.activeRange : DEFAULT_TIME_RANGE);
	});

	previousBounds = $derived.by<RangeBounds>(() => getPreviousRangeBounds(this.bounds, TIME_ZONE));

	/**
	 * One-shot read of both dashboard data sets for the current range. Retains the previous
	 * snapshot in state while a new range loads, and ignores out-of-order responses from rapid
	 * range changes. `fetchDummy*` accepts the same arguments the Convex queries will.
	 */
	load = async (): Promise<void> => {
		const requestId = ++this.#requestId;
		const current = { from: this.bounds.from.getTime(), to: this.bounds.to.getTime() };
		const previous = {
			from: this.previousBounds.from.getTime(),
			to: this.previousBounds.to.getTime()
		};

		this.statsLoading = true;
		this.statsError = undefined;
		this.revenueLoading = true;
		this.revenueError = undefined;

		const [stats, revenue] = await Promise.all([
			toOutcome(fetchDummyDashboard(this.#scope, current, previous)),
			toOutcome(fetchDummyRevenueSeries(this.#scope, current))
		]);

		if (requestId !== this.#requestId) return;

		if (stats.ok) this.statsData = stats.value;
		else this.statsError = stats.error;
		this.statsLoading = false;

		if (revenue.ok) this.revenueData = revenue.value;
		else this.revenueError = revenue.error;
		this.revenueLoading = false;
	};

	refresh = (): void => {
		void this.load();
	};

	selectPreset = (value: PresetTimeRange): void => {
		this.customRange = undefined;
		this.activeRange = value;
		this.selectedPreset = value;
		this.#searchParams.write({ timerange: value, from: '', to: '' });
		void this.load();
	};

	handlePresetChange = (next: string): void => {
		if (isPreset(next)) {
			this.selectPreset(next);
			return;
		}

		this.selectedPreset = isPreset(this.activeRange) ? this.activeRange : '';
	};

	applyCustomRange = (range: { start: DateValue; end: DateValue }): boolean => {
		if (daysInRange(range.start, range.end) > MAX_RANGE_DAYS) {
			this.selectPreset('today');
			return false;
		}

		this.customRange = { start: range.start, end: range.end };
		this.activeRange = 'custom';
		this.selectedPreset = '';
		this.#searchParams.write({
			timerange: 'custom',
			from: toIsoDate(range.start),
			to: toIsoDate(range.end)
		});
		void this.load();
		return true;
	};
}

/**
 * Creates the analytics dashboard state for one scope (admin or host), shares it through context,
 * and loads the first snapshot when the owning page mounts. Descendants read it with
 * `useAnalyticsDashboard()`.
 */
export function createAnalyticsDashboard(scope: AnalyticsScope): AnalyticsDashboardState {
	const dashboard = createAnalyticsDashboardContext(new AnalyticsDashboardState(scope));

	onMount(() => {
		void dashboard.load();
	});

	return dashboard;
}

/** Reads the analytics dashboard state shared by `createAnalyticsDashboard()`. */
export function useAnalyticsDashboard(): AnalyticsDashboardState {
	return useAnalyticsDashboardContext<AnalyticsDashboardState>();
}
