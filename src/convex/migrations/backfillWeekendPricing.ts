// CONVEX
import { migrations } from './migrations.js';
// UTILS
import { calculateStayPricing } from '../../shared/features/bookings/utils/calculateStayPricing.js';

export const backfillWeekendPrices = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (accommodation.weekendPricePerNightMinor !== undefined) return;
		await ctx.db.patch('accommodations', accommodation._id, { weekendPricePerNightMinor: null });
	}
});

/** Preserve historical accepted nightly rates, regardless of current listing prices. */
export const backfillStayPricing = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const terms = booking.cancellationTerms;
		if (terms.stayPricing !== undefined) return;
		const stayPricing = calculateStayPricing(
			{
				pricePerNightMinor: terms.pricePerNightMinor,
				discountBps: 0,
				weekendPricePerNightMinor: null
			},
			booking.checkInDate,
			booking.checkOutDate
		);
		if (terms.stayType === 'day_use') stayPricing.totalMinor = terms.pricePerDayUseMinor ?? 0;
		await ctx.db.patch('bookings', booking._id, { cancellationTerms: { ...terms, stayPricing } });
	}
});
