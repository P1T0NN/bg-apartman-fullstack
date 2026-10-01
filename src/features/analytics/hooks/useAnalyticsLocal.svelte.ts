// LIBRARIES
import { onMount } from 'svelte';

// HOOKS
import { useGuestLocal } from '@/features/guests/hooks/useGuestLocal.svelte.js';

/**
 * App-wide analytics identity. Reuses the browser's untrusted guest id
 * (`GUESTS_CONFIG.STORAGE_KEY`) instead of a second id, and makes sure it
 * exists as soon as the app loads.
 *
 * Call once during client init (the root layout).
 */
export function useAnalyticsLocal() {
	const guest = useGuestLocal();

	onMount(() => {
		guest.ensureGuestId();
	});

	return {
		get guestId() {
			return guest.guestId;
		}
	};
}
