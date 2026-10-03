<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import ReviewDialog from '@/features/reviews/components/review-dialog/review-dialog.svelte';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	let {
		booking,
		accommodationName
	}: {
		booking: Pick<Doc<'bookings'>, '_id' | 'checkInDate' | 'checkOutDate'> & { timeZone: string };
		accommodationName: string;
	} = $props();
</script>

<ReviewDialog
	bookingId={booking._id}
	{accommodationName}
	checkInDate={booking.checkInDate}
	checkOutDate={booking.checkOutDate}
	timeZone={booking.timeZone}
>
	{#snippet trigger({ id })}
		<Button
			commandfor={id}
			command="show-modal"
			variant="outline"
			class="min-h-11 w-full flex-wrap justify-between gap-3 sm:w-auto"
		>
			{m['AccommodationPage.AccommodationReviewBookingItem.leaveReview']()}

			<span>
				{formatDate(Date.parse(booking.checkInDate), getLocale())} &ndash; {formatDate(
					Date.parse(booking.checkOutDate),
					getLocale()
				)}
			</span>
		</Button>
	{/snippet}
</ReviewDialog>
