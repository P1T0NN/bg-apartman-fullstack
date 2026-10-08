export type AnalyticsScope = 'admin' | 'host';

export type PresetTimeRange = 'today' | '7d' | '30d' | '90d';
export type TimeRange = PresetTimeRange | 'custom';
export type RangeBounds = { from: Date; to: Date };
export type AnalyticsStat = {
	title: string;
	value: number;
	change?: number;
	format?: (value: number) => string;
	/** True when a rising value is bad (cancellation rate): colors the badge by direction of improvement. */
	lowerIsBetter?: boolean;
};

export type DashboardStats = {
	revenue: number;
	bookings: number;
	/** Percentage of bookings that were cancelled in the range. */
	cancellationRate: number;
	/** Average share of available nights that were booked in the range. */
	occupancyRate: number;
};

export type DashboardComparison = {
	current: DashboardStats;
	previous: DashboardStats;
};

export type RevenuePoint = {
	date: number;
	revenue: number;
};
