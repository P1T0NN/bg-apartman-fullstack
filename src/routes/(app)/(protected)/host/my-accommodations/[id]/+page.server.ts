// LIBRARIES
import { createConvexHttpClient } from 'convex-svelte/sveltekit';
import { api } from '@convex/_generated/api';

// TYPES
import type { Id } from '@convex/_generated/dataModel';
import type { PageServerLoad } from './$types';

/** One-call fetch for the page header; the listing tab stays on a live query. */
export const load: PageServerLoad = async ({ locals, params }) => {
	const client = createConvexHttpClient({ token: locals.token });

	try {
		// SAFETY: Convex validates the untrusted route ID before running the query.
		const id = params.id as Id<'accommodations'>;
		const accommodation = await client.query(
			api.tables.accommodations.queries.fetchMyAccommodation.fetchMyAccommodation,
			{ id }
		);
		return { accommodation };
	} catch (error) {
		console.error('[MyAccommodationPage] header summary failed', error);
		return { accommodation: null };
	}
};
