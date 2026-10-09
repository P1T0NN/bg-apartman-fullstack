import { getLoyaltyMembership } from './getLoyaltyMembership.js';
import { getLoyaltyLevel } from '../../../../shared/features/loyalty/utils/getLoyaltyLevel.js';
import type { Id } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

export async function awardLoyaltyStay(ctx: MutationCtx, bookingId: Id<'bookings'>) {
	const booking = await ctx.db.get('bookings', bookingId);
	if (!booking?.ownerId) return;
	const qualifies = booking.status === 'completed' && booking.loyaltyStatus === 'pending';
	if (!qualifies) return;
	const ownerId = booking.ownerId;
	const membership = await getLoyaltyMembership(ctx, ownerId);
	const qualifyingStays = (membership?.qualifyingStays ?? 0) + 1;
	const level = getLoyaltyLevel(qualifyingStays);
	const joinedAt = membership?.joinedAt ?? (level > 0 ? Date.now() : null);
	if (membership) {
		await ctx.db.patch('loyaltyMemberships', membership._id, { qualifyingStays, level, joinedAt });
	} else {
		await ctx.db.insert('loyaltyMemberships', { ownerId, qualifyingStays, level, joinedAt });
	}
	await ctx.db.patch('bookings', bookingId, { loyaltyStatus: 'credited' });
}
