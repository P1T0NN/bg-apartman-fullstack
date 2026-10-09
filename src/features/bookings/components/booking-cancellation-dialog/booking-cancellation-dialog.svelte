<script lang="ts">
	// SVELTEKIT IMPORTS
	import { onDestroy } from 'svelte';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import BookingCancellationDialogForm from './booking-cancellation-dialog-form.svelte';
	import BookingCancellationDialogHeader from './booking-cancellation-dialog-header.svelte';
	import BookingCancellationPolicy from '../booking-cancellation-policy/booking-cancellation-policy.svelte';

	// UTILS
	import { canCancelBooking } from '@/shared/features/bookings/utils/canCancelBooking.js';
	import { checkBookingCancellationRefund } from '@/shared/features/bookings/utils/checkBookingCancellationRefund.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';
	import type { CancellationRefundPercentage } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';

	let {
		booking,
		accommodationName,
		now
	}: {
		booking: Pick<Doc<'bookings'>, '_id' | 'status' | 'cancellationTerms'>;
		accommodationName: string;
		now: number;
	} = $props();

	const uid = $props.id();

	let active = $state(false);
	let submitting = $state(false);
	let dialogNow = $state(0);
	let reviewedStatus = $state<'pending' | 'confirmed'>('pending');
	let reviewedRefund = $state<CancellationRefundPercentage | null>(null);
	let timer: ReturnType<typeof setInterval> | undefined;

	const isWithdrawal = $derived(reviewedStatus === 'pending');
	const eligible = $derived(canCancelBooking(booking, dialogNow));
	const currentRefund = $derived(
		booking.status === 'pending'
			? null
			: checkBookingCancellationRefund(booking.cancellationTerms, dialogNow)
	);
	const changed = $derived(booking.status !== reviewedStatus || currentRefund !== reviewedRefund);

	function reviewTerms() {
		dialogNow = Date.now();
		if (booking.status !== 'pending' && booking.status !== 'confirmed') return;
		reviewedStatus = booking.status;
		reviewedRefund =
			booking.status === 'pending'
				? null
				: checkBookingCancellationRefund(booking.cancellationTerms, dialogNow);
	}

	function stopClock() {
		clearInterval(timer);
		timer = undefined;
	}

	onDestroy(stopClock);
</script>

{#if canCancelBooking(booking, now)}
	<NativeDialog
		aria-labelledby={`${uid}-title`}
		class="max-w-[calc(100%-2rem)] sm:max-w-xl"
		onbeforetoggle={(event) => {
			if (event.newState === 'open') {
				reviewTerms();
				active = true;
				stopClock();
				timer = setInterval(() => {
					dialogNow = Date.now();
				}, 1000);
			}
		}}
		onclose={() => {
			active = false;
			stopClock();
		}}
	>
		{#snippet trigger({ id })}
			<Button
				variant="destructive"
				commandfor={id}
				command="show-modal"
				class="min-h-11 w-full sm:w-auto"
			>
				{booking.status === 'pending'
					? m['BookingsFeature.BookingCancellationDialog.withdraw']()
					: m['BookingsFeature.BookingCancellationDialog.cancel']()}
			</Button>
		{/snippet}

		{#snippet children({ id, close })}
			<div class="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
				<BookingCancellationDialogHeader
					titleId={`${uid}-title`}
					{isWithdrawal}
					{accommodationName}
					cancellationTerms={booking.cancellationTerms}
				/>

				{#if active}
					{#if isWithdrawal}
						<p class="text-sm text-muted-foreground">
							{m['BookingsFeature.BookingCancellationDialog.noPayment']()}
						</p>
					{:else}
						<BookingCancellationPolicy
							policy={booking.cancellationTerms.policy}
							timeZone={booking.cancellationTerms.timeZone}
							checkInAt={booking.cancellationTerms.checkInAt}
							refundDeadlineAt={booking.cancellationTerms.refundDeadlineAt}
							amountMinor={booking.cancellationTerms.stayPricing.totalMinor}
							currency={booking.cancellationTerms.currency}
							status={booking.status}
							booked
							compact
						/>
					{/if}

					{#if !eligible}
						<p role="status" class="text-sm text-destructive">
							{m['BackendMessages.bookingCancellationNotEligible']()}
						</p>
					{:else if changed}
						<div class="flex flex-col gap-2" role="status">
							<p class="text-sm">{m['BackendMessages.bookingCancellationChanged']()}</p>
							<Button variant="outline" disabled={submitting} onclick={reviewTerms}>
								{m['BookingsFeature.BookingCancellationDialog.reviewUpdated']()}
							</Button>
						</div>
					{/if}

					<BookingCancellationDialogForm
						bookingId={booking._id}
						{reviewedStatus}
						{reviewedRefund}
						{eligible}
						{changed}
						{id}
						{close}
						bind:submitting
					/>
				{/if}
			</div>
		{/snippet}
	</NativeDialog>
{/if}
