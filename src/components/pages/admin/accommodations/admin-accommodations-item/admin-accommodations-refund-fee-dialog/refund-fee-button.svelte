<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';
	import { useMutation } from 'convex-svelte';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import ConfirmDialogActions from '@/components/ui/custom-components/confirm-dialog-actions/confirm-dialog-actions.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	let {
		paymentId,
		expectedAmountMinor,
		canRefund,
		dialogId,
		close
	}: {
		paymentId: Id<'accommodationFeePayments'>;
		expectedAmountMinor: number;
		canRefund: boolean;
		dialogId: string;
		close: () => void;
	} = $props();

	const refund = useMutation(
		api.tables.accommodationFeePayments.mutations.refundAccommodationFee.refundAccommodationFee
	);

	let pending = $state(false);

	async function refundFee(): Promise<void> {
		const canConfirm = canRefund && !pending && expectedAmountMinor > 0;

		if (!canConfirm) return;

		pending = true;

		try {
			await refund({ paymentId, expectedAmountMinor });

			toastMessage({
				type: 'success',
				message: m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.saved']()
			});

			close();
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<ConfirmDialogActions
	{pending}
	cancelCommandFor={dialogId}
	cancelLabel={m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.cancel']()}
	confirmLabel={m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.trigger']()}
	confirmDisabled={!canRefund}
	onConfirm={refundFee}
/>
