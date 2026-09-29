// HELPERS
import { resolveImageUrls } from '../../accommodations/utils/resolveImageUrls.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { AccommodationListItem } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

type Favorite = Doc<'favorites'>;

/** Keep only published accommodations for each favorite row, with resolved image urls. */
export async function withPublishedAccommodationImageUrls({
	ctx,
	items
}: {
	ctx: QueryCtx;
	items: Favorite[];
}): Promise<AccommodationListItem[]> {
	const accommodations = await Promise.all(
		items.map((favorite) => ctx.db.get(favorite.accommodationId))
	);

	const published = accommodations.filter(
		(accommodation): accommodation is Doc<'accommodations'> =>
			accommodation !== null && accommodation.status === 'published'
	);

	return resolveImageUrls(published);
}
