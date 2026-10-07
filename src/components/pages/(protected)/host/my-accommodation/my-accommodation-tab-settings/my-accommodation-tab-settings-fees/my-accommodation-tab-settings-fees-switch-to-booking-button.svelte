<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';
	import { api } from '@convex/_generated/api.js';
	import { useMutation } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Doc, Id } from '@convex/_generated/dataModel.js';

	let {
		isLocked,
		status,
		pending = $bindable(false)
	}: {
		isLocked: boolean;
		status: Doc<'accommodations'>['status'];
		pending: boolean;
	} = $props();

	const changePlan = useMutation(
		api.tables.accommodations.mutations.changeAccommodationBillingPlan
			.changeAccommodationBillingPlan
	);

	async function switchToBookingFee() {
		if (pending || isLocked) return;

		const wantsPublication = status === 'published';

		pending = true;

		try {
			await changePlan({
				// SAFETY: Convex validates the untrusted route ID and checks ownership.
				id: page.params.id as Id<'accommodations'>,
				billingPlanId: 'booking_fee',
				expectedBillingPlanId: 'flat_fee'
			});

			toastMessage({
				type: 'success',
				message: wantsPublication
					? m[
							'MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToBookingButton.updatedVisible'
						]()
					: m[
							'MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToBookingButton.updatedPaused'
						]()
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<Button
	type="button"
	variant="outline"
	disabled={pending || isLocked}
	onclick={() => void switchToBookingFee()}
>
	{#if pending}
		<Spinner data-icon="inline-start" />
	{/if}
	{m['MyAccommodationPage.MyAccommodationTabSettingsFeesSwitchToBookingButton.switchToBooking']()}
</Button>
