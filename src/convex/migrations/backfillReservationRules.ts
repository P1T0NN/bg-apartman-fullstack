// MIGRATIONS
import { migrations } from './migrations.js';

/** Fill the retained arrival-today setting on legacy listings. */
export const backfillAccommodationReservationRules = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (accommodation.sameDayReservation !== undefined) return;
		await ctx.db.patch('accommodations', accommodation._id, { sameDayReservation: false });
	}
});

/** Preserve frozen day-use fees; historical overnight stays have no day-use fee. */
export const backfillBookingReservationTerms = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const terms = booking.cancellationTerms;
		const complete = terms.stayType !== undefined && terms.pricePerDayUseMinor !== undefined;
		if (complete) return;
		const stayType =
			terms.stayType ?? (booking.checkInDate === booking.checkOutDate ? 'day_use' : 'overnight');
		const missingDayUseFee = stayType === 'day_use' && terms.pricePerDayUseMinor == null;
		if (missingDayUseFee)
			throw new Error(`Resolve missing frozen day-use fee for booking ${booking._id}`);
		await ctx.db.patch('bookings', booking._id, {
			cancellationTerms: {
				...terms,
				stayType,
				pricePerDayUseMinor: terms.pricePerDayUseMinor ?? null
			}
		});
	}
});
