// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONSTANTS
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
import { AUTH_REDIRECT_PARAM, AUTH_VIEW_PARAM } from '@/shared/features/auth/data/authData.js';

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent, url }) => {
	const { authState, currentUser } = await parent();

	if (!authState.isAuthenticated) {
		// Same dialog entry as (protected): resume at the requested admin page.
		const params = new URLSearchParams({
			[AUTH_VIEW_PARAM]: 'sign-in',
			[AUTH_REDIRECT_PARAM]: `${url.pathname}${url.search}`
		});
		redirect(303, `${UNPROTECTED_PAGE_ENDPOINTS.ROOT}?${params}`);
	}

	if (currentUser?.role !== 'admin') {
		redirect(303, UNPROTECTED_PAGE_ENDPOINTS.ROOT);
	}

	return {};
};
