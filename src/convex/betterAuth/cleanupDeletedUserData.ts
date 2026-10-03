// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '../_generated/api.js';
import { internalMutation } from '../builders/convexFunctionBuilders.js';

// STORAGE
import { queueUploadDeletion } from '../storage/r2.js';

const CLEANUP_BATCH_SIZE = 50;

export const cleanupDeletedUserData = internalMutation({
	args: { ownerId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const uploadBatches = await Promise.all(
			(['pending', 'processing', 'uploaded'] as const).map((status) =>
				ctx.db
					.query('storageUploads')
					.withIndex('by_owner_id_and_status_and_created_at', (query) =>
						query.eq('ownerId', args.ownerId).eq('status', status)
					)
					.take(CLEANUP_BATCH_SIZE)
			)
		);
		const uploads = uploadBatches.flat();
		if (uploads.length) await queueUploadDeletion(ctx, uploads);

		if (uploadBatches.some((batch) => batch.length === CLEANUP_BATCH_SIZE)) {
			await ctx.scheduler.runAfter(
				0,
				internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData,
				{ ownerId: args.ownerId }
			);
		}
		return null;
	}
});
