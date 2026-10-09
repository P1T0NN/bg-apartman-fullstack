import { migrations } from './migrations.js';
import { getLoyaltyLevel } from '../../shared/features/loyalty/utils/getLoyaltyLevel.js';

export const backfillAccommodationEligibility = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (accommodation.loyaltyEligible !== undefined) return;
		await ctx.db.patch('accommodations', accommodation._id, { loyaltyEligible: false });
	}
});

export const backfillBookingLoyaltyStatus = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		if (booking.loyaltyStatus !== undefined) return;
		await ctx.db.patch('bookings', booking._id, { loyaltyStatus: 'ineligible' });
	}
});

export const backfillMembershipLevels = migrations.define({
	table: 'loyaltyMemberships',
	migrateOne: async (ctx, membership) => {
		const level = getLoyaltyLevel(membership.qualifyingStays);
		await ctx.db.patch('loyaltyMemberships', membership._id, {
			level,
			joinedAt: level > 0 ? (membership.joinedAt ?? Date.now()) : null
		});
	}
});
