// SVELTEKIT IMPORTS
import { env } from '$env/dynamic/public';

// LIBRARIES
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@convex/_generated/api';
import { authClient } from '@/features/auth/lib/authClient.js';

// TYPES
import type { Id } from '@convex/_generated/dataModel';
import type { PageLoad } from './$types';

export const ssr = false;

/** One-shot browser fetch for the header; the listing tab stays on a live query. */
export const load: PageLoad = async ({ parent, params }) => {
	const { authState } = await parent();
	if (!authState.isAuthenticated) return { accommodation: null };

	return { accommodation: fetchAccommodation(params.id) };
};

async function fetchAccommodation(routeId: string) {
	try {
		// Load runs before layout components initialize the shared Convex client.
		const { data, error } = await authClient.convex.token();

		if (error || !data?.token) throw new Error('Could not authenticate accommodation query');

		const client = new ConvexHttpClient(env.PUBLIC_CONVEX_URL);
		client.setAuth(data.token);

		// SAFETY: Convex validates the route ID and checks ownership before returning data.
		const id = routeId as Id<'accommodations'>;
		const accommodation = await client.query(
			api.tables.accommodations.queries.fetchMyAccommodation.fetchMyAccommodation,
			{ id }
		);
		return accommodation;
	} catch (error) {
		console.error('[MyAccommodationPage] header summary failed', error);

		return null;
	}
}
