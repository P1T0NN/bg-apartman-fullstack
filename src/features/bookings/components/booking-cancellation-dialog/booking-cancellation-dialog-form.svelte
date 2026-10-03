<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { cancelBookingSchema } from '@/shared/features/bookings/schemas/bookingSchemas.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { CancellationRefundPercentage } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

	let {
		bookingId,
		reviewedStatus,
		reviewedRefund,
		eligible,
		changed,
		id,
		close,
		submitting = $bindable(false)
	}: {
		bookingId: Id<'bookings'>;
		reviewedStatus: 'pending' | 'confirmed';
		reviewedRefund: CancellationRefundPercentage | null;
		eligible: boolean;
		changed: boolean;
		id: string;
		close: () => void;
		submitting?: boolean;
	} = $props();

	const isWithdrawal = $derived(reviewedStatus === 'pending');

	const fields = $derived<FieldConfig[]>([
		{
			kind: 'textarea',
			name: 'reason',
			label: isWithdrawal
				? m['BookingsFeature.BookingCancellationDialogForm.withdrawReason']()
				: m['BookingsFeature.BookingCancellationDialogForm.reason'](),
			description: m['BookingsFeature.BookingCancellationDialogForm.reasonHint'](),
			required: true,
			rows: 4,
			disabled: !eligible
		}
	]);
</script>

<Form
	function={api.tables.bookings.mutations.cancelBooking.cancelBooking}
	schema={cancelBookingSchema}
	{fields}
	extraFields={{
		bookingId,
		expectedStatus: reviewedStatus,
		expectedRefundPercentage: reviewedRefund,
		locale: getLocale()
	}}
	bind:submitting
	onSuccess={close}
	resetOnSuccess={false}
	successMessage={isWithdrawal
		? m['BookingsFeature.BookingCancellationDialogForm.withdrawn']()
		: m['BookingsFeature.BookingCancellationDialogForm.cancelled']()}
>
	<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
		<Button
			type="button"
			variant="outline"
			disabled={submitting}
			commandfor={id}
			command="close"
			class="min-h-11"
		>
			{isWithdrawal
				? m['BookingsFeature.BookingCancellationDialogForm.keepRequest']()
				: m['BookingsFeature.BookingCancellationDialogForm.keepBooking']()}
		</Button>

		<Button
			type="submit"
			variant="destructive"
			disabled={submitting || !eligible || changed}
			class="min-h-11"
		>
			{#if submitting}
				<Spinner data-icon="inline-start" />
			{/if}
			
			{isWithdrawal
				? m['BookingsFeature.BookingCancellationDialogForm.confirmWithdrawal']()
				: m['BookingsFeature.BookingCancellationDialogForm.confirmCancellation']()}
		</Button>
	</div>
</Form>
