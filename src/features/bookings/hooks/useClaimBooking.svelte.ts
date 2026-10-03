// SVELTEKIT IMPORTS
import { onMount } from 'svelte';

// LIBRARIES
import { useMutation } from 'convex-svelte';
import { api } from '@convex/_generated/api';

// CONFIG
import { BOOKINGS_CONFIG } from '@/shared/features/bookings/config.js';

// SCHEMAS
import { claimBookingSchema } from '@/shared/features/bookings/schemas/claimBookingSchema.js';

// TYPES
import type { z } from 'zod';
import type { Id } from '@convex/_generated/dataModel';

/** Keeps the selected booking in this tab while authentication redirects run. */
export function useClaimBooking() {
	let intent = $state<z.infer<typeof claimBookingSchema> | null>(null);
	let ready = $state(false);
	let submitting = $state(false);

	// SAFETY: Storage is untrusted; Convex validates the ID and authorizes the claim.
	const args = $derived(
		intent ? { bookingId: intent.bookingId as Id<'bookings'>, token: intent.token } : null
	);
	const claimBooking = useMutation(api.tables.bookings.mutations.claimBooking.claimBooking);

	onMount(() => {
		try {
			const raw = sessionStorage.getItem(BOOKINGS_CONFIG.RECOVERY_CLAIM_STORAGE_KEY);
			if (raw) {
				const parsed = claimBookingSchema.safeParse(JSON.parse(raw));
				intent = parsed.success ? parsed.data : null;
			}
		} catch {
			intent = null;
		}
		ready = true;
	});

	function save(bookingId: Id<'bookings'>, token: string): void {
		const nextIntent = claimBookingSchema.parse({ bookingId, token });
		sessionStorage.setItem(BOOKINGS_CONFIG.RECOVERY_CLAIM_STORAGE_KEY, JSON.stringify(nextIntent));
		intent = nextIntent;
	}

	function clear(): void {
		sessionStorage.removeItem(BOOKINGS_CONFIG.RECOVERY_CLAIM_STORAGE_KEY);
		intent = null;
	}

	async function submit(): Promise<boolean> {
		if (submitting) return false;

		if (!args) return false;

		submitting = true;

		try {
			await claimBooking(args);

			clear();

			return true;
		} finally {
			submitting = false;
		}
	}

	return {
		get args() {
			return args;
		},
		get ready() {
			return ready;
		},
		get submitting() {
			return submitting;
		},
		save,
		clear,
		submit
	};
}
