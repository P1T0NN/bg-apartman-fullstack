// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

// UTILS
import { DAY_IN_MS, getStoreDayKey } from '@/shared/utils/date.js';

// TYPES
import type {
	AnalyticsScope,
	DashboardComparison,
	DashboardStats,
	RevenuePoint
} from '@/shared/features/analytics/types/analyticsTypes.js';

/**
 * Illustrative dashboard data. This project has no orders or payment pipeline yet, so this
 * module stands in for the real `fetchDashboard` / `fetchRevenueSeries` queries. Values are
 * deterministic per store day, so ranges, refreshes and period comparisons stay stable.
 */

export type DummyDateRange = { from: number; to: number };

type ScopeConfig = {
	/** Shifts the per-day pseudo-random seed so admin and host see different numbers. */
	seedOffset: number;
	minBookingsPerDay: number;
	bookingSpread: number;
};

const DUMMY_LATENCY_MS = 350;
const WEEKEND_BOOKING_MULTIPLIER = 1.4;
const MIN_AVERAGE_BOOKING_MINOR = 8_500;
const BOOKING_VALUE_SPREAD_MINOR = 11_500;
const CANCELLATION_MIN_RATE = 0.04;
const CANCELLATION_RATE_SPREAD = 0.12;
const OCCUPANCY_BASE = 0.35;
const OCCUPANCY_SPREAD = 0.35;
const OCCUPANCY_WEEKEND_BONUS = 0.08;
const SEASONALITY_AMPLITUDE = 0.3;
const DAYS_PER_YEAR = 365;
const MIN_OCCUPANCY = 0.15;
const MAX_OCCUPANCY = 0.98;

const SCOPE_CONFIG = {
	admin: { seedOffset: 0, minBookingsPerDay: 2, bookingSpread: 9 },
	host: { seedOffset: 97_531, minBookingsPerDay: 0, bookingSpread: 4 }
} satisfies Record<AnalyticsScope, ScopeConfig>;

function pseudoRandom(seed: number): number {
	let hash = (seed + 0x9e3779b9) | 0;
	hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
	hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
	hash ^= hash >>> 16;
	return (hash >>> 0) / 4_294_967_296;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function roundToTenth(value: number): number {
	return Math.round(value * 10) / 10;
}

function getDailySales(dayKey: number, config: ScopeConfig) {
	const dayNumber = Math.round(dayKey / DAY_IN_MS) + config.seedOffset;
	const weekday = new Date(dayKey).getUTCDay();
	const isWeekend = weekday === 0 || weekday === 6;
	const seasonality =
		1 + SEASONALITY_AMPLITUDE * Math.sin((dayNumber / DAYS_PER_YEAR) * Math.PI * 2);
	const bookings = Math.round(
		(config.minBookingsPerDay + pseudoRandom(dayNumber) * config.bookingSpread) *
			(isWeekend ? WEEKEND_BOOKING_MULTIPLIER : 1) *
			seasonality
	);
	const averageBookingValue = Math.round(
		MIN_AVERAGE_BOOKING_MINOR + pseudoRandom(dayNumber + 1) * BOOKING_VALUE_SPREAD_MINOR
	);
	const cancelled = Math.round(
		bookings * (CANCELLATION_MIN_RATE + pseudoRandom(dayNumber + 2) * CANCELLATION_RATE_SPREAD)
	);
	const occupancy = clamp(
		OCCUPANCY_BASE +
			pseudoRandom(dayNumber + 3) * OCCUPANCY_SPREAD +
			(isWeekend ? OCCUPANCY_WEEKEND_BONUS : 0) +
			(seasonality - 1) * 0.3,
		MIN_OCCUPANCY,
		MAX_OCCUPANCY
	);

	return { revenue: bookings * averageBookingValue, bookings, cancelled, occupancy };
}

function summarize(range: DummyDateRange, config: ScopeConfig): DashboardStats {
	const firstDay = getStoreDayKey(range.from, COMPANY_DATA.TIMEZONE);
	const lastDay = getStoreDayKey(range.to, COMPANY_DATA.TIMEZONE);
	let revenue = 0;
	let bookings = 0;
	let cancelled = 0;
	let occupancyTotal = 0;
	let dayCount = 0;

	for (let day = firstDay; day <= lastDay; day += DAY_IN_MS) {
		const daily = getDailySales(day, config);
		revenue += daily.revenue;
		bookings += daily.bookings;
		cancelled += daily.cancelled;
		occupancyTotal += daily.occupancy;
		dayCount += 1;
	}

	return {
		revenue,
		bookings,
		cancellationRate: bookings > 0 ? roundToTenth((cancelled / bookings) * 100) : 0,
		occupancyRate: dayCount > 0 ? roundToTenth((occupancyTotal / dayCount) * 100) : 0
	};
}

function waitForLatency(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, DUMMY_LATENCY_MS));
}

export async function fetchDummyDashboard(
	scope: AnalyticsScope,
	current: DummyDateRange,
	previous: DummyDateRange
): Promise<DashboardComparison> {
	await waitForLatency();
	const config = SCOPE_CONFIG[scope];
	return { current: summarize(current, config), previous: summarize(previous, config) };
}

export async function fetchDummyRevenueSeries(
	scope: AnalyticsScope,
	range: DummyDateRange
): Promise<RevenuePoint[]> {
	await waitForLatency();
	const config = SCOPE_CONFIG[scope];
	const firstDay = getStoreDayKey(range.from, COMPANY_DATA.TIMEZONE);
	const lastDay = getStoreDayKey(range.to, COMPANY_DATA.TIMEZONE);
	const series: RevenuePoint[] = [];

	for (let day = firstDay; day <= lastDay; day += DAY_IN_MS) {
		series.push({ date: day, revenue: getDailySales(day, config).revenue });
	}

	return series;
}
