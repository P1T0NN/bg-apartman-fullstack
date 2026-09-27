// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';
import { accommodations } from '../schema.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

export const fetchPublicAccommodation = query({
	args: { id: v.id('accommodations') },
	returns: v.union(
		docValidator('accommodations', accommodations)
			.omit('ownerId', 'imageKeys')
			.extend({ imageUrls: v.array(v.string()) }),
		v.null()
	),
	handler: async (ctx, { id }) => {
		const accommodation = await ctx.db.get(id);

		if (!accommodation || accommodation.status !== 'published') return null;

		const { ownerId: _ownerId, imageKeys, ...details } = accommodation;
		
		return { ...details, imageUrls: await resolveStoredFileUrls(imageKeys) };
	}
});
