// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { internal } from '../../../_generated/api.js';

// BUILDERS
import {
	authenticatedMutation,
	internalMutation
} from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { accommodationOwnerAggregate } from '../aggregates/accommodationOwnerAggregate.js';
import { reviewAggregate } from '../../reviews/aggregates/reviewAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// STORAGE
import { deleteStoredFiles } from '../../../storage/r2.js';

// TYPES
import type { MutationCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Bound each transaction; continuations are scheduled while references remain. */
const REFERENCE_CLEANUP_BATCH = 100;

/** Pending requests and confirmed stays are unresolved business; everything else is history. */
async function hasActiveBookings(
	ctx: MutationCtx,
	accommodationId: Id<'accommodations'>
): Promise<boolean> {
	for (const status of ['pending', 'confirmed'] as const) {
		const active = await ctx.db
			.query('bookings')
			.withIndex('by_accommodation_id_status_check_out_at', (q) =>
				q.eq('accommodationId', accommodationId).eq('status', status)
			)
			.first();
		if (active) return true;
	}
	return false;
}

/** Removes private child rows that mean nothing without their accommodation. */
async function deleteAccommodationReferences(
	ctx: MutationCtx,
	accommodationId: Id<'accommodations'>
): Promise<void> {
	const favorites = await ctx.db
		.query('favorites')
		.withIndex('by_accommodation_id', (q) => q.eq('accommodationId', accommodationId))
		.take(REFERENCE_CLEANUP_BATCH);
	for (const favorite of favorites) await ctx.db.delete('favorites', favorite._id);

	const blockedDates = await ctx.db
		.query('accommodationBlockedDates')
		.withIndex('by_accommodation_id_date', (q) => q.eq('accommodationId', accommodationId))
		.take(REFERENCE_CLEANUP_BATCH);
	for (const blockedDate of blockedDates)
		await ctx.db.delete('accommodationBlockedDates', blockedDate._id);

	const hasMore =
		favorites.length === REFERENCE_CLEANUP_BATCH || blockedDates.length === REFERENCE_CLEANUP_BATCH;
	if (hasMore) {
		await ctx.scheduler.runAfter(
			0,
			internal.tables.accommodations.mutations.deleteAccommodation
				.continueDeleteAccommodationReferences,
			{ accommodationId }
		);
	}
}

/**
 * Owner-scoped soft delete. Pending or confirmed bookings block deletion;
 * favorites, blocked dates, aggregates and stored images are removed while the
 * listing becomes a tombstone (`status: 'deleted'`) so booking and review
 * history still resolves it.
 */
export const deleteAccommodation = authenticatedMutation({
	rateLimit: { name: 'accommodations:delete' },
	args: { id: v.id('accommodations') },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		const accommodation = await ctx.db.get('accommodations', id);
		if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity))
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		// Repeat deletes are a no-op instead of touching a tombstone again.
		if (accommodation.status === 'deleted') return null;

		if (await hasActiveBookings(ctx, id))
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_HAS_ACTIVE_BOOKINGS' });

		await reviewAggregate.clear(ctx, { namespace: id });
		await accommodationOwnerAggregate.delete(ctx, accommodation);
		await deleteStoredFiles(ctx, accommodation.imageKeys);
		await ctx.db.patch('accommodations', id, {
			status: 'deleted',
			// Storage is already gone; keep the tombstone free of dangling keys.
			imageKeys: [],
			deletedAt: Date.now(),
			deletedBy: getOwnerId(ctx.identity),
			updatedAt: Date.now()
		});
		await deleteAccommodationReferences(ctx, id);

		return null;
	}
});

/** Scheduled continuation for listings with more favorites or blocked nights than one batch. */
export const continueDeleteAccommodationReferences = internalMutation({
	args: { accommodationId: v.id('accommodations') },
	returns: v.null(),
	handler: async (ctx, { accommodationId }) => {
		await deleteAccommodationReferences(ctx, accommodationId);
		return null;
	}
});
