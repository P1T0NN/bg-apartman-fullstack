import { calculateStayPricing } from '../../shared/features/bookings/utils/calculateStayPricing.js';
import { migrations } from './migrations.js';
import { ACCOMMODATION_CONFIG } from '../../shared/features/accommodations/config.js';
import { COMPANY_DATA } from '../../shared/config.js';
import { getZonedTimestamp } from '../../shared/features/timezone/utils/getZonedTimestamp.js';
import { timeZoneSchema } from '../../shared/features/timezone/schemas/timezoneSchemas.js';

/** Adopt full refund for pre-policy development bookings; preserve every existing snapshot. */
export const backfillBookingTiming = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const terms = booking.cancellationTerms;
		if (terms?.checkOut !== undefined && terms.checkOutAt !== undefined) return;
		const accommodation = await ctx.db.get('accommodations', booking.accommodationId);
		if (!accommodation) throw new Error(`Resolve missing property for booking ${booking._id}`);
		const timeZone = timeZoneSchema.parse(terms?.timeZone ?? accommodation.timeZone);
		const checkOut = terms?.checkOut ?? accommodation.checkOut;
		const original = terms ?? {
			policy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
			timeZone,
			checkInStart: accommodation.checkInStart,
			checkInAt: getZonedTimestamp(booking.checkInDate, accommodation.checkInStart, timeZone),
			pricePerNightMinor: accommodation.effectivePricePerNightMinor,
			basePricePerNightMinor: accommodation.pricePerNightMinor,
			discountBps: accommodation.discountBps,
			stayPricing: calculateStayPricing(accommodation, booking.checkInDate, booking.checkOutDate),
			stayType: 'overnight' as const,
			pricePerDayUseMinor: null,
			currency: COMPANY_DATA.CURRENCY
		};
		await ctx.db.patch('bookings', booking._id, {
			cancellationTerms: {
				...original,
				stayType: original.stayType ?? 'overnight',
				pricePerDayUseMinor: original.pricePerDayUseMinor ?? null,
				checkOut,
				checkOutAt: terms?.checkOutAt ?? getZonedTimestamp(booking.checkOutDate, checkOut, timeZone)
			}
		});
	}
});
