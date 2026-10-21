// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';

// TYPES
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	redirect(308, `${resolve('/settings')}${url.search}`);
};
