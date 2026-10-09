<script lang="ts">
	// LIBRARIES
	import { useAction } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages.js';

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

	let pending = $state(false);

	const refund = useAction(
		api.tables.accommodationFeePayments.actions.refundAccommodationFee.refundAccommodationFee
	);

	async function refundFee() {
		if (pending || expectedAmountMinor <= 0) return;
		pending = true;
		try {
			await refund({ paymentId, expectedAmountMinor });
			close();
			toastMessage({
				type: 'success',
				message: m['AdminAccommodationsPage.AdminAccommodationsRefundFeeDialog.saved']()
			});
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
	onConfirm={() => refundFee()}
/>
