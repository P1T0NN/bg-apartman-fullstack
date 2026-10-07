// HELPERS
import { resolveImageUrls } from '../../accommodations/utils/resolveImageUrls.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';
import type { AccommodationCard } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

type Favorite = Doc<'favorites'>;

/** Keep only published accommodations for each favorite row, with resolved image urls. */
export async function withPublishedAccommodationImageUrls({
	ctx,
	items
}: {
	ctx: QueryCtx;
	items: Favorite[];
}): Promise<AccommodationCard[]> {
	const accommodations = await Promise.all(
		items.map((favorite) => ctx.db.get('accommodations', favorite.accommodationId))
	);

	const published = accommodations.filter((accommodation): accommodation is Doc<'accommodations'> =>
		isAccommodationVisible(accommodation)
	);

	return resolveImageUrls(published);
}
