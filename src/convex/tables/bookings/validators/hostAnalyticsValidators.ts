// LIBRARIES
import { v } from 'convex/values';

export const hostDashboardStats = v.object({
	revenue: v.number(),
	bookingFeesPaid: v.number(),
	bookings: v.number(),
	cancellationRate: v.null()
});

export const hostDashboardComparison = v.object({
	bookingFeesPending: v.number(),
	current: hostDashboardStats,
	previous: hostDashboardStats
});
