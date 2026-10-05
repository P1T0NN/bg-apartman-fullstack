<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';

	let { value }: { value: DateRange | undefined } = $props();

	const selected = $derived.by(() => ({
		checkIn: value?.start ? formatDate(value.start.toDate('UTC').getTime(), getLocale()) : '',
		checkOut: value?.end ? formatDate(value.end.toDate('UTC').getTime(), getLocale()) : ''
	}));
</script>

<div class="grid gap-3 sm:grid-cols-2">
	<div class="rounded-lg border px-3 py-2">
		<p class="text-xs text-muted-foreground">
			{m['BookingsFeature.BookingStayDatesHeader.checkIn']()}
		</p>
		<p class={cn('text-sm font-medium', !selected.checkIn && 'font-normal text-muted-foreground')}>
			{selected.checkIn || m['BookingsFeature.BookingStayDatesHeader.selectDates']()}
		</p>
	</div>

	<div class="rounded-lg border px-3 py-2">
		<p class="text-xs text-muted-foreground">
			{m['BookingsFeature.BookingStayDatesHeader.checkOut']()}
		</p>
		<p class={cn('text-sm font-medium', !selected.checkOut && 'font-normal text-muted-foreground')}>
			{selected.checkOut || m['BookingsFeature.BookingStayDatesHeader.selectDates']()}
		</p>
	</div>
</div>
