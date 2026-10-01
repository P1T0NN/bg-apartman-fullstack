<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import ReviewDialogAccommodationInfo from './review-dialog-accommodation-info.svelte';
	import ReviewDialogForm from './review-dialog-form.svelte';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';
	import { getReviewDeadline } from '@/shared/features/reviews/utils/getReviewDeadline.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { Snippet } from 'svelte';

	let {
		bookingId,
		accommodationName,
		checkInDate,
		checkOutDate,
		trigger: customTrigger
	}: {
		bookingId: Id<'bookings'>;
		accommodationName: string;
		checkInDate: string;
		checkOutDate: string;
		trigger?: Snippet<[{ id: string }]>;
	} = $props();

	const titleId = $props.id();

	let active = $state(false);

	let submitting = $state(false);
</script>

<NativeDialog
	aria-labelledby={titleId}
	class="max-w-[calc(100%-2rem)] sm:max-w-xl"
	onbeforetoggle={(event) => {
		if (event.newState === 'open') active = true;
	}}
	onclose={() => (active = false)}
>
	{#snippet trigger({ id })}
		{#if customTrigger}
			{@render customTrigger({ id })}
		{:else}
			<Button commandfor={id} command="show-modal" class="min-h-11 w-full sm:w-auto">
				{m['ReviewsFeature.ReviewDialog.leaveReview']()}
			</Button>
		{/if}
	{/snippet}

	{#snippet children({ id, close })}
		<div class="flex flex-col gap-5 p-4 sm:p-6">
			<div class="flex items-start justify-between gap-4">
				<ReviewDialogAccommodationInfo {titleId} {accommodationName} {checkInDate} {checkOutDate} />

				<Button
					variant="outline"
					disabled={submitting}
					commandfor={id}
					command="close"
					class="min-h-11"
				>
					{m['ReviewsFeature.ReviewDialog.cancel']()}
				</Button>
			</div>

			{#if active}
				<p class="text-sm text-muted-foreground">
					{m['ReviewsFeature.ReviewDialog.deadline']({
						date: formatDate(getReviewDeadline(checkOutDate) - 1, getLocale())
					})}
				</p>

				<ReviewDialogForm {bookingId} bind:submitting onSuccess={close} />
			{/if}
		</div>
	{/snippet}
</NativeDialog>
