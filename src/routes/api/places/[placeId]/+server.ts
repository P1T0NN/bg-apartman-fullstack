// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';

// LIBRARIES
import { z } from 'zod';

// TYPES
import type { RequestHandler } from '@sveltejs/kit';

const GOOGLE_PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

const placeIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,300}$/);
const languageCodeSchema = z
	.string()
	.regex(/^[A-Za-z-]{2,10}$/)
	.optional();

const googleResponseSchema = z.object({
	addressComponents: z
		.array(
			z.object({
				longText: z.string().optional(),
				types: z.array(z.string())
			})
		)
		.optional(),
	location: z.object({ latitude: z.number(), longitude: z.number() }).optional()
});

export const GET: RequestHandler = async ({ params, url }) => {
	const apiKey = env.GOOGLE_PLACES_NEW_API_KEY?.trim() ?? '';
	if (!apiKey) throw error(503, 'Places API is not configured');

	const parsedPlaceId = placeIdSchema.safeParse(params.placeId);
	if (!parsedPlaceId.success) throw error(400, 'Invalid place id');

	const parsedLanguageCode = languageCodeSchema.safeParse(
		url.searchParams.get('languageCode') ?? undefined
	);
	if (!parsedLanguageCode.success) throw error(400, 'Invalid language code');
	const sessionToken = z
		.uuid()
		.optional()
		.safeParse(url.searchParams.get('sessionToken') ?? undefined);
	if (!sessionToken.success) throw error(400, 'Invalid session token');

	const detailsUrl = new URL(`${GOOGLE_PLACE_DETAILS_URL}/${parsedPlaceId.data}`);
	if (parsedLanguageCode.data) detailsUrl.searchParams.set('languageCode', parsedLanguageCode.data);
	if (sessionToken.data) detailsUrl.searchParams.set('sessionToken', sessionToken.data);

	const response = await fetch(detailsUrl, {
		headers: {
			'X-Goog-Api-Key': apiKey,
			'X-Goog-FieldMask': 'addressComponents,location'
		},
		signal: AbortSignal.timeout(10000)
	});
	if (!response.ok) throw error(502, 'Place details failed');

	const parsedResponse = googleResponseSchema.safeParse(await response.json());
	if (!parsedResponse.success) throw error(502, 'Unexpected place details response');

	const components = parsedResponse.data.addressComponents ?? [];
	const component = (type: string) => components.find((part) => part.types.includes(type));
	const location = parsedResponse.data.location;
	return json({
		country: component('country')?.longText ?? null,
		city: component('locality')?.longText ?? component('postal_town')?.longText ?? null,
		street: component('route')?.longText ?? null,
		postalCode: component('postal_code')?.longText ?? null,
		position: location ? { lat: location.latitude, lng: location.longitude } : null
	});
};
