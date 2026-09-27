// LIBRARIES
import { afterEach, expect, test, vi } from 'vitest';

// ROUTES
import { POST } from '../src/routes/api/places/autocomplete/+server.js';
import { GET } from '../src/routes/api/places/[placeId]/+server.js';

// UTILS
import { getCountryOptions } from '../src/shared/utils/countries.js';

// SvelteKit's virtual environment module does not exist in Vitest; supply only its test key.
// oxlint-disable-next-line anti-slop/no-module-mocking
vi.mock('$env/dynamic/private', () => ({ env: { GOOGLE_PLACES_NEW_API_KEY: 'test-key' } }));
afterEach(() => vi.unstubAllGlobals());

// SAFETY: the route reads only request from RequestEvent in these tests.
const request = (body: Record<string, string>) =>
	({
		request: new Request('https://example.com/api/places/autocomplete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	}) as Parameters<typeof POST>[0];

test('street search restricts Google to routes and excludes non-street predictions; home search keeps its default', async () => {
	const fetchMock = vi.fn().mockResolvedValue(
		Response.json({
			suggestions: [
				{
					placePrediction: {
						placeId: 'street',
						types: ['route'],
						text: { text: 'Main Street, London, UK' },
						structuredFormat: {
							mainText: { text: 'Main Street' },
							secondaryText: { text: 'London, UK' }
						}
					}
				},
				{ placePrediction: { placeId: 'city', types: ['locality'], text: { text: 'London' } } },
				{ placePrediction: { placeId: 'country', types: ['country'], text: { text: 'UK' } } }
			]
		})
	);
	vi.stubGlobal('fetch', fetchMock);
	const response = await POST(request({ input: 'Ma', kind: 'street' }));
	expect(JSON.parse(fetchMock.mock.calls[0][1].body).includedPrimaryTypes).toEqual(['route']);
	expect(await response.json()).toEqual({
		suggestions: [
			{
				placeId: 'street',
				label: 'Main Street, London, UK',
				mainText: 'Main Street',
				secondaryText: 'London, UK'
			}
		]
	});
	fetchMock.mockResolvedValue(Response.json({ suggestions: [] }));
	await POST(request({ input: 'Lo' }));
	expect(JSON.parse(fetchMock.mock.calls[1][1].body).includedPrimaryTypes).toEqual([
		'locality',
		'country'
	]);
	await expect(POST(request({ input: 'M', kind: 'street' }))).rejects.toMatchObject({
		status: 400
	});
});

test('place details returns address parts, uses postal town when locality is absent, and forwards the session', async () => {
	const fetchMock = vi.fn().mockResolvedValue(
		Response.json({
			addressComponents: [
				{ longText: 'Main Street', types: ['route'] },
				{ longText: 'London', types: ['postal_town'] },
				{ longText: 'United Kingdom', shortText: 'GB', types: ['country'] }
			],
			location: { latitude: 51.5072, longitude: -0.1276 }
		})
	);
	vi.stubGlobal('fetch', fetchMock);
	const token = '11111111-1111-4111-8111-111111111111';
	// SAFETY: this GET handler reads only params and url from RequestEvent.
	const response = await GET({
		params: { placeId: 'street' },
		url: new URL('https://example.com/api/places/street?languageCode=en&sessionToken=' + token)
	} as Parameters<typeof GET>[0]);
	expect(await response.json()).toEqual({
		street: 'Main Street',
		city: 'London',
		country: 'United Kingdom',
		postalCode: null,
		position: { lat: 51.5072, lng: -0.1276 }
	});
	expect(String(fetchMock.mock.calls[0][0])).toContain('sessionToken=' + token);
	expect(fetchMock.mock.calls[0][1].headers['X-Goog-FieldMask']).toBe('addressComponents,location');
});

test('country options store and display the country name', () => {
	expect(getCountryOptions('en')).toContainEqual({ value: 'Serbia', label: 'Serbia' });
	expect(getCountryOptions('de')).toContainEqual({ value: 'Deutschland', label: 'Deutschland' });
});
