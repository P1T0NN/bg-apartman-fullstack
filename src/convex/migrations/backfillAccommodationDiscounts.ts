// CONVEX
import { migrations } from './migrations.js';
// UTILS
import { calculateDiscountedPrice } from '../../shared/features/accommodations/utils/calculateAccommodationPricing.js';

export const backfillAccommodationDiscounts = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (
			accommodation.discountBps !== undefined &&
			accommodation.effectivePricePerNightMinor !== undefined
		)
			return;
		const discountBps = accommodation.discountBps ?? 0;
		await ctx.db.patch('accommodations', accommodation._id, {
			discountBps,
			effectivePricePerNightMinor: calculateDiscountedPrice(
				accommodation.pricePerNightMinor,
				discountBps
			)
		});
	}
});

/** Historical prices come from their frozen terms, never the current listing. */
export const backfillBookingDiscounts = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const terms = booking.cancellationTerms;
		if (terms.basePricePerNightMinor !== undefined && terms.discountBps !== undefined) return;
		await ctx.db.patch('bookings', booking._id, {
			cancellationTerms: {
				...terms,
				basePricePerNightMinor: terms.basePricePerNightMinor ?? terms.pricePerNightMinor,
				discountBps: terms.discountBps ?? 0
			}
		});
	}
});
