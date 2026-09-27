// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';

// LIBRARIES
import { z } from 'zod';

// TYPES
import type { RequestHandler } from '@sveltejs/kit';

const GOOGLE_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

const requestSchema = z.object({
	input: z.string().trim().min(2).max(200),
	languageCode: z.string().trim().min(2).max(10).optional(),
	sessionToken: z.uuid().optional(),
	kind: z.enum(['location', 'street']).default('location')
});

const googleResponseSchema = z.object({
	suggestions: z
		.array(
			z.object({
				placePrediction: z
					.object({
						placeId: z.string(),
						types: z.array(z.string()).optional(),
						text: z.object({ text: z.string() }).optional(),
						structuredFormat: z
							.object({
								mainText: z.object({ text: z.string() }).optional(),
								secondaryText: z.object({ text: z.string() }).optional()
							})
							.optional()
					})
					.optional()
			})
		)
		.optional()
});

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.GOOGLE_PLACES_NEW_API_KEY?.trim() ?? '';
	if (!apiKey) throw error(503, 'Places API is not configured');

	const parsedRequest = requestSchema.safeParse(await request.json().catch(() => null));
	if (!parsedRequest.success) throw error(400, 'Invalid autocomplete request');

	const response = await fetch(GOOGLE_AUTOCOMPLETE_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': apiKey
		},
		body: JSON.stringify({
			input: parsedRequest.data.input,
			includedPrimaryTypes:
				parsedRequest.data.kind === 'street' ? ['route'] : ['locality', 'country'],
			languageCode: parsedRequest.data.languageCode,
			sessionToken: parsedRequest.data.sessionToken
		}),
		signal: AbortSignal.timeout(10000)
	});
	if (!response.ok) throw error(502, 'Places autocomplete failed');

	const parsedResponse = googleResponseSchema.safeParse(await response.json());
	if (!parsedResponse.success) throw error(502, 'Unexpected autocomplete response');

	const suggestions = (parsedResponse.data.suggestions ?? []).flatMap(({ placePrediction }) => {
		if (!placePrediction) return [];
		if (parsedRequest.data.kind === 'street' && !placePrediction.types?.includes('route'))
			return [];

		const label =
			placePrediction.text?.text ?? placePrediction.structuredFormat?.mainText?.text ?? '';
		if (!label) return [];
		return [
			{
				placeId: placePrediction.placeId,
				label,
				mainText: placePrediction.structuredFormat?.mainText?.text ?? label,
				secondaryText: placePrediction.structuredFormat?.secondaryText?.text ?? ''
			}
		];
	});

	return json({ suggestions });
};
