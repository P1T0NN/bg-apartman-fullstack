// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { AccommodationCard } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

/** Resolve ordered image urls for list rows; `limit` keeps only the first n (cover-only lists). */
export async function resolveImageUrls(
	items: Doc<'accommodations'>[],
	limit?: number
): Promise<AccommodationCard[]> {
	const imageKeys = [...new Set(items.flatMap((item) => item.imageKeys.slice(0, limit)))];
	const urls = await resolveStoredFileUrls(imageKeys);
	const urlByKey = new Map(imageKeys.map((key, index) => [key, urls[index]]));

	return items.map((item) => ({
		_id: item._id,
		_creationTime: item._creationTime,
		name: item.name,
		bookingMode: item.bookingMode ?? 'request',
		type: item.type,
		address: { city: item.address.city, country: item.address.country },
		latitude: item.latitude,
		longitude: item.longitude,
		maxGuests: item.maxGuests,
		bedrooms: item.bedrooms,
		beds: item.beds,
		bathrooms: item.bathrooms,
		pricePerNightMinor: item.pricePerNightMinor,
		discountBps: item.discountBps,
		weekendPricePerNightMinor: item.weekendPricePerNightMinor,
		effectivePricePerNightMinor: item.effectivePricePerNightMinor,
		imageUrls: item.imageKeys
			.slice(0, limit)
			.map((key) => urlByKey.get(key))
			.filter((url): url is string => url !== undefined)
	}));
}
