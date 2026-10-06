// LIBRARIES
import { z } from 'zod';
import { paymentMethodSchema } from '../../payments/schemas/paymentSchemas.js';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../accommodations/config.js';

// UTILS
import { DAY_IN_MS, parseIsoDate } from '../../../utils/date.js';
import { getZonedTimestamp } from '../../timezone/utils/getZonedTimestamp.js';

/** Booking and recovery lookup share this normalization; preserve dots and plus tags. */
export const bookingEmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const cancelBookingSchema = z.object({
	bookingId: z.string().min(1),
	reason: z.string().trim().min(1).max(500),
	expectedStatus: z.enum(['pending', 'confirmed']),
	expectedRefundPercentage: z.union([
		...ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES.map((percentage) =>
			z.literal(percentage)
		),
		z.null()
	]),
	locale: z.string().min(1).max(35)
});

export const completeBookingAdminSchema = z.object({
	bookingId: z.string().min(1),
	reason: z.string().trim().min(1).max(500)
});

/** Listing facts the stay checks need; the client passes the loaded listing, Convex the stored one. */
type BookingStayLimits = {
	today: string;
	minimumStay: number;
	maximumStay?: number;
	maxGuests: number;
	sameDayReservation?: boolean;
	checkInStart?: string;
	timeZone?: string;
	now?: number;
};

export function createBookingSchema(limits: BookingStayLimits) {
	return (
		z
			.object({
				paymentMethod: paymentMethodSchema,
				accommodationId: z.string().min(1),
				expectedBookingMode: z.enum(['request', 'instant']).optional(),
				expectedTotalMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
				expectedPricePerNightMinor: z.number().int().min(1).max(10_000_000),
				checkInDate: z.iso.date(),
				checkOutDate: z.iso.date(),
				adults: z.coerce.number().int().min(1).max(100),
				children: z.coerce.number().int().min(0).max(100),
				firstName: z.string().trim().min(1).max(100),
				lastName: z.string().trim().min(1).max(100),
				email: bookingEmailSchema,
				phone: z.string().trim().min(6).max(40),
				specialRequests: z.preprocess(
					(value) => (value === '' ? undefined : value),
					z.string().trim().max(1000).optional()
				)
			})
			// Codes resolve to translated text through the customError map in src/lib/validation.ts.
			.superRefine((booking, ctx) => {
				const stayIssue = (code: string, count?: number) =>
					ctx.addIssue({
						code: 'custom',
						path: ['stayDates'],
						params: count === undefined ? { code } : { code, count }
					});

				const start = parseIsoDate(booking.checkInDate);
				const end = parseIsoDate(booking.checkOutDate);
				// z.iso.date() already rejected malformed or impossible calendar dates.
				if (!start || !end) return;

				if (booking.checkInDate < limits.today) {
					stayIssue('PAST_STAY_DATE');
				} else {
					const nights = (Date.parse(end.toString()) - Date.parse(start.toString())) / DAY_IN_MS;

					if (nights <= 0) stayIssue('STAY_DATE_ORDER');
					else if (nights < limits.minimumStay) stayIssue('STAY_BELOW_MINIMUM', limits.minimumStay);
					else if (limits.maximumStay && nights > limits.maximumStay)
						stayIssue('STAY_ABOVE_MAXIMUM', limits.maximumStay);
					if (booking.checkInDate === limits.today && !limits.sameDayReservation)
						stayIssue('SAME_DAY_RESERVATION_DISABLED');
					const arrivalTime = limits.checkInStart;
					const { timeZone, now } = limits;
					const canCheckCutoff =
						booking.checkInDate === limits.today &&
						limits.sameDayReservation &&
						arrivalTime &&
						timeZone &&
						now !== undefined;
					if (canCheckCutoff) {
						try {
							if (getZonedTimestamp(booking.checkInDate, arrivalTime, timeZone) <= now)
								stayIssue('BOOKING_START_PASSED');
						} catch {
							stayIssue('BOOKING_CHECK_IN_TIME_UNAVAILABLE');
						}
					}
				}

				if (booking.adults + booking.children > limits.maxGuests) {
					ctx.addIssue({
						code: 'custom',
						path: ['adults'],
						params: { code: 'STAY_GUEST_LIMIT', count: limits.maxGuests }
					});
				}
			})
	);
}
