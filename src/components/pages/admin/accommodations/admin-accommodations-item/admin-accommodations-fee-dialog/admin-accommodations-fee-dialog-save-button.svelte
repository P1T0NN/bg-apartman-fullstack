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

	// SCHEMAS
	import { adminAccommodationsFeeDialogFormSchema } from '@/shared/features/accommodations/schemas/accommodationSchemas.js';

	// TYPES
	import type { AdminAccommodationsFeeDialogDraft } from './admin-accommodations-fee-dialog-form.svelte';

	let {
		draft,
		close,
		pending = $bindable(false)
	}: {
		draft: AdminAccommodationsFeeDialogDraft;
		close: () => void;
		pending: boolean;
	} = $props();

	const updateFee = useMutation(
		api.tables.accommodations.mutations.updateAccommodationFeeForAdmin
			.updateAccommodationFeeForAdmin
	);

	const grantFree = useMutation(
		api.tables.accommodations.mutations.grantFreeAccommodationFeeForAdmin
			.grantFreeAccommodationFeeForAdmin
	);

	async function save() {
		if (pending) return;

		const parsed = adminAccommodationsFeeDialogFormSchema.safeParse(draft);
		if (!parsed.success) {
			toastMessage({
				type: 'error',
				error: parsed.error,
				message: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogSaveButton.invalid']()
			});
			return;
		}
		const values = parsed.data;

		pending = true;

		try {
			if (values.plan === 'free') {
				await grantFree({
					id: draft.id,
					billingPeriodEndsAt: values.forever ? null : new Date(values.deadline).getTime()
				});
			} else {
				await updateFee({
					id: draft.id,
					billingTerms:
						values.plan === 'flat_fee'
							? {
									model: 'flat_fee',
									amountMinor: Math.round(values.amount * 100),
									currency: 'EUR',
									intervalMonths: values.months
								}
							: {
									model: 'booking_fee',
									commissionBps: Math.round(values.commission * 100)
								},
					billingStatus: values.plan === 'booking_fee' ? 'active' : values.status,
					billingPeriodEndsAt:
						values.plan === 'booking_fee' || !values.deadline
							? null
							: new Date(values.deadline).getTime()
				});
			}

			close();

			toastMessage({
				type: 'success',
				message: m['AdminAccommodationsPage.AdminAccommodationsFeeDialogSaveButton.saved']()
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<Button type="button" disabled={pending} onclick={() => void save()}>
	{#if pending}
		<Spinner data-icon="inline-start" />
	{/if}

	{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogSaveButton.save']()}
</Button>
