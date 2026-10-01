<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	// HOOKS
	import { useClaimBooking } from '@/features/bookings/hooks/useClaimBooking.svelte.js';
	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';
	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	let { bookingId, token }: { bookingId: Id<'bookings'>; token: string } = $props();
	const claim = useClaimBooking();
	async function startClaim() {
		try {
			claim.save(bookingId, token);
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- Endpoint constants already call resolve().
			await goto(PROTECTED_PAGE_ENDPOINTS.CLAIM_BOOKING);
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: m['FindBookingPage.FindBookingClaimButton.failed']()
			});
		}
	}
</script>

<Button type="button" class="min-h-11 w-full sm:w-auto" onclick={startClaim}>
	{m['FindBookingPage.FindBookingClaimButton.add']()}
</Button>
