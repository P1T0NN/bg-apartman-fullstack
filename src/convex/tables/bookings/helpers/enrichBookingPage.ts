// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

/** Enrich only the current owner-scoped page; retain requests for removed listings. */
export async function enrichBookingPage(
	ctx: QueryCtx,
	items: Doc<'bookings'>[],
	options: { onlyPublished?: boolean } = {}
) {
	const onlyPublished = options.onlyPublished ?? true;
	return Promise.all(
		items.map(async (booking) => {
			const accommodation = await ctx.db.get('accommodations', booking.accommodationId);

			const isHidden = !accommodation || (onlyPublished && !isAccommodationVisible(accommodation));

			if (isHidden) {
				return {
					...booking,
					cancellationTerms: booking.cancellationTerms,
					accommodation: null
				};
			}

			const [imageUrl] = await resolveStoredFileUrls(accommodation.imageKeys.slice(0, 1));

			return {
				...booking,
				cancellationTerms: booking.cancellationTerms,
				accommodation: {
					name: accommodation.name,
					city: accommodation.address.city,
					country: accommodation.address.country,
					imageUrl: imageUrl ?? null
				}
			};
		})
	);
}
