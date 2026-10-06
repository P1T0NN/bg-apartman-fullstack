<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';

	let { value, checkOutTime }: { value: DateRange | undefined; checkOutTime: string } = $props();

	const selected = $derived.by(() => ({
		checkIn: value?.start ? formatDate(value.start.toDate('UTC').getTime(), getLocale()) : '',
		checkOut: value?.end ? formatDate(value.end.toDate('UTC').getTime(), getLocale()) : ''
	}));
</script>

<div class="grid grid-cols-2 divide-x rounded-xl border bg-muted/40">
	<div class="min-w-0 px-4 py-4 sm:px-5">
		<p class="text-xs font-medium text-muted-foreground">
			{m['BookingsFeature.BookingStayDatesHeader.checkIn']()}
		</p>
		<p
			class={cn(
				'mt-2 text-base font-semibold tracking-tight',
				!selected.checkIn && 'font-normal text-muted-foreground'
			)}
		>
			{selected.checkIn || m['BookingsFeature.BookingStayDatesHeader.selectDates']()}
		</p>
	</div>

	<div class="min-w-0 px-4 py-4 sm:px-5">
		<p class="text-xs font-medium text-muted-foreground">
			{m['BookingsFeature.BookingStayDatesHeader.checkOut']()}
		</p>
		<p
			class={cn(
				'mt-2 text-base font-semibold tracking-tight',
				!selected.checkOut && 'font-normal text-muted-foreground'
			)}
		>
			{selected.checkOut || m['BookingsFeature.BookingStayDatesHeader.selectDates']()}
		</p>
		<p class="mt-2 text-xs leading-5 text-muted-foreground">
			{m['BookingPage.BookCheckoutForm.checkOutTime']({ time: checkOutTime })}
		</p>
	</div>
</div>
