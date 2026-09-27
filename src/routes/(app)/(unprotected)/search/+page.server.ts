// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

// LIBRARIES
import { getLocale } from '@/lib/paraglide/runtime';
import { z } from 'zod';

// SCHEMAS
import { searchLocationSchema } from '@/shared/features/search/schemas/searchSchemas.js';

// TYPES
import type { PageServerLoad } from './$types';

const placeDetailsResponseSchema = z.object({
	country: z.string().nullable(),
	city: z.string().nullable(),
	position: z.object({ lat: z.number(), lng: z.number() }).nullable()
});

export const load: PageServerLoad = async ({ fetch, url }) => {
	const parsedLocation = searchLocationSchema.safeParse({
		placeId: url.searchParams.get('location')
	});
	if (!parsedLocation.success) return { placeDetails: null };

	const endpoint = resolve('/api/places/[placeId]', {
		placeId: parsedLocation.data.placeId
	});
	const detailsUrl = new URL(endpoint, url);
	detailsUrl.searchParams.set('languageCode', getLocale());

	try {
		const response = await fetch(detailsUrl);
		if (!response.ok) throw new Error(`Place details failed with ${response.status}`);

		const parsedDetails = placeDetailsResponseSchema.safeParse(await response.json());
		if (!parsedDetails.success) throw new Error('Unexpected place details response');

		return { placeDetails: parsedDetails.data };
	} catch (error) {
		console.error('[SearchPage] place details failed', error);
		return { placeDetails: null };
	}
};
