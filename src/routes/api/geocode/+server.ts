import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { getAuthState } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { z } from 'zod';

import type { RequestHandler } from './$types';

const addressSchema = z.object({
	street: z.string().trim().min(3).max(200),
	streetNumber: z.string().trim().max(20),
	city: z.string().trim().min(2).max(100),
	postalCode: z.string().trim().max(20),
	country: z.string().trim().min(2).max(100)
});

const responseSchema = z.object({
	status: z.string(),
	results: z.array(
		z.object({ geometry: z.object({ location: z.object({ lat: z.number(), lng: z.number() }) }) })
	)
});

export const POST: RequestHandler = async ({ request }) => {
	if (!getAuthState().isAuthenticated) throw error(401);

	const apiKey = env.GOOGLE_GEOCODING_API_KEY?.trim();
	if (!apiKey) throw error(503, 'Geocoding is not configured');

	const parsed = addressSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) throw error(400, 'Invalid address');

	const { street, streetNumber, city, postalCode, country } = parsed.data;
	const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
	url.searchParams.set(
		'address',
		[street, streetNumber, city, postalCode].filter(Boolean).join(', ')
	);
	url.searchParams.set('components', `country:${country}`);
	url.searchParams.set('key', apiKey);

	const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
	if (!response.ok) throw error(502, 'Geocoding failed');

	const result = responseSchema.safeParse(await response.json());
	if (!result.success) throw error(502, 'Unexpected geocoding response');
	if (result.data.status === 'ZERO_RESULTS') return json({ position: null });
	if (result.data.status !== 'OK') throw error(502, 'Geocoding failed');

	return json({ position: result.data.results[0]?.geometry.location ?? null });
};
