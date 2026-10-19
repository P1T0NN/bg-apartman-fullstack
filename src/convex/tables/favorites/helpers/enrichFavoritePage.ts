// HELPERS
import { resolveImageUrls } from '../../accommodations/utils/resolveImageUrls.js';

// UTILS
import { isAccommodationPublic } from '../../accommodations/helpers/isAccommodationPublic.js';

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

	const visibility = await Promise.all(
		accommodations.map((accommodation) => isAccommodationPublic(ctx, accommodation))
	);
	const published = accommodations.filter(
		(accommodation, index): accommodation is Doc<'accommodations'> =>
			accommodation !== null && visibility[index]
	);

	return resolveImageUrls(published);
}
