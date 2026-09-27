// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';

export type AccommodationListItem = Doc<'accommodations'> & {
	coverUrl: string | null;
	imageUrls: string[];
};

export async function withCoverUrls(
	items: Doc<'accommodations'>[]
): Promise<AccommodationListItem[]> {
	const imageKeys = [...new Set(items.flatMap((item) => item.imageKeys))];
	const urls = await resolveStoredFileUrls(imageKeys);
	const urlByKey = new Map(imageKeys.map((key, index) => [key, urls[index]]));

	return items.map((item) => {
		const imageUrls = item.imageKeys
			.map((key) => urlByKey.get(key))
			.filter((url): url is string => url !== undefined);
		return { ...item, imageUrls, coverUrl: imageUrls[0] ?? null };
	});
}
