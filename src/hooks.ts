// LIBRARIES
import { deLocalizeUrl } from './lib/paraglide/runtime';

// CONFIG
import './lib/validation.js';

// TYPES
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
