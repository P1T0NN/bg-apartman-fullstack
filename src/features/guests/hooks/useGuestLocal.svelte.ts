// CONFIG
import { GUESTS_CONFIG } from '@/shared/features/guests/config.js';

// HOOKS
import { useLocalStorage } from '@/hooks/useLocalStorage.svelte.js';

// UTILS
import { parseStoredUuid } from '@/shared/utils/parseStoredUuid.js';

/**
 * Browser continuity for guest checkout. Owns the untrusted localStorage
 * `guestId` created with `crypto.randomUUID()`; it never authorizes access, so
 * the server treats it as a hint and email recovery works without it.
 *
 * Persistence is `useLocalStorage`, which re-reads on same-tab and cross-tab
 * changes. When storage is missing, blocked, or full, the id still lives in
 * memory for the session so checkout is never gated on it.
 *
 * Call during component init (a `<script>` block), never at module scope.
 */
export function useGuestLocal() {
	const stored = useLocalStorage<string | undefined>(
		GUESTS_CONFIG.STORAGE_KEY,
		undefined,
		parseStoredUuid
	);
	let sessionGuestId = $state<string | undefined>(undefined);

	const guestId = $derived(stored.value ?? sessionGuestId);

	/** Return the browser's guest id, creating and persisting one when absent. */
	function ensureGuestId(): string {
		if (guestId) return guestId;

		const created = crypto.randomUUID();
		if (!stored.set(created)) sessionGuestId = created;
		return created;
	}

	/** Forget this browser's association. Server ownership, if any, is unaffected. */
	function clearGuestId(): void {
		stored.remove();
		sessionGuestId = undefined;
	}

	return {
		get guestId() {
			return guestId;
		},
		ensureGuestId,
		clearGuestId
	};
}
