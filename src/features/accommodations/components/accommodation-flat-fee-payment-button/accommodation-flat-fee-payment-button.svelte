<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	let {
		accommodationId,
		isExpired,
		pending = $bindable(false)
	}: {
		accommodationId: Id<'accommodations'>;
		isExpired: boolean;
		pending: boolean;
	} = $props();
	const pay = useMutation(
		api.tables.accommodations.mutations.payFlatFeeAccommodation.payFlatFeeAccommodation
	);

	async function payFlatFee() {
		if (pending) return;
		pending = true;
		try {
			await pay({ id: accommodationId });
			toastMessage({
				type: 'success',
				message: m['AccommodationsFeature.AccommodationFlatFeePaymentButton.success']()
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<Button type="button" disabled={pending} onclick={() => void payFlatFee()}>
	{#if pending}<Spinner data-icon="inline-start" />{/if}
	{isExpired
		? m['AccommodationsFeature.AccommodationFlatFeePaymentButton.renew']()
		: m['AccommodationsFeature.AccommodationFlatFeePaymentButton.pay']()}
</Button>
