// CONVEX
import { migrations } from './migrations.js';

// CONFIG
import { ACCOMMODATION_BILLING_PLANS } from '../../shared/features/accommodations/config.js';

/** Configure future bookings without rewriting explicit admin commission overrides. */
export const configureBookingFeeCommission = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		const terms = accommodation.billingTerms;
		if (terms.model !== 'booking_fee' || terms.commissionBps !== null) return;
		await ctx.db.patch('accommodations', accommodation._id, {
			billingTerms: ACCOMMODATION_BILLING_PLANS.booking_fee,
			updatedAt: Date.now()
		});
	}
});

/** Historical fees cannot be inferred from a listing's current plan. Null means unknown. */
export const backfillBookingPlatformFeeTerms = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		if (booking.platformFeeTerms !== undefined) return;
		await ctx.db.patch('bookings', booking._id, { platformFeeTerms: null });
	}
});
