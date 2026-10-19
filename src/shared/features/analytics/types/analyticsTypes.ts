export type AnalyticsScope = 'admin' | 'host';

export type PresetTimeRange = 'today' | '7d' | '30d' | '90d';
export type TimeRange = PresetTimeRange | 'custom';
export type RangeBounds = { from: Date; to: Date };
export type AnalyticsStat = {
	title: string;
	value: number | undefined;
	change?: number;
	format?: (value: number) => string;
	caption?: string;
	showComparison?: boolean;
	/** True when a rising value is bad (cancellation rate): colors the badge by direction of improvement. */
	lowerIsBetter?: boolean;
};

export type DashboardStats = {
	revenue: number;
	/** Net collected listing fees; present for the platform dashboard only. */
	flatFeeRevenue?: number;
	/** Verified platform shares of online payments, less confirmed commission refunds. */
	bookingFeeRevenue?: number;
	/** Collected booking fees less refunds, attributed to collection time. */
	bookingFeesPaid?: number;
	bookings: number;
	/** Percentage of bookings that were cancelled in the range. */
	cancellationRate: number | null;
};

export type DashboardComparison = {
	/** Expected online platform shares awaiting payment verification, across all dates. */
	bookingFeesPending?: number;
	current: DashboardStats;
	previous: DashboardStats;
};

export type RevenuePoint = {
	date: number;
	revenue: number;
};
