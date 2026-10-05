// LIBRARIES
import { v } from 'convex/values';

export const calendarResult = v.object({
	blockedDates: v.array(v.string()),
	bookings: v.array(v.object({ checkInDate: v.string(), checkOutDate: v.string() }))
});
