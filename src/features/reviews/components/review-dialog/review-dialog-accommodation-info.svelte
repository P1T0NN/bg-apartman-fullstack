<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	let {
		titleId,
		accommodationName,
		checkInDate,
		checkOutDate
	}: {
		titleId: string;
		accommodationName: string;
		checkInDate: string;
		checkOutDate: string;
	} = $props();
</script>

<div class="flex min-w-0 flex-col gap-2">
	<h2 id={titleId} class="text-xl font-semibold">
		{m['ReviewsFeature.ReviewDialogAccommodationInfo.title']()}
	</h2>

	<p class="font-medium wrap-anywhere">{accommodationName}</p>

	<p class="text-sm text-muted-foreground">
		{m['ReviewsFeature.ReviewDialogAccommodationInfo.stay']({
			checkIn: formatDate(Date.parse(checkInDate), getLocale()),
			checkOut: formatDate(Date.parse(checkOutDate), getLocale())
		})}
	</p>
</div>
