<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import type { DateValue } from '@internationalized/date';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as RangeCalendar from '@/components/ui/range-calendar/index.js';

	let { placeholder = $bindable(), minValue }: { placeholder: DateValue; minValue: DateValue } =
		$props();
</script>

<RangeCalendar.Header class="h-auto justify-between gap-3 border-b p-4 sm:px-5">
	<RangeCalendar.Heading class="text-lg font-semibold" />

	<div class="flex items-center gap-1">
		<Button
			variant="outline"
			size="sm"
			onclick={() => {
				if (placeholder.compare(minValue) !== 0) placeholder = minValue;
			}}
		>
			{m['MyAccommodationPage.MyAccommodationCalendarHeader.today']()}
		</Button>

		<RangeCalendar.PrevButton
			aria-label={m['MyAccommodationPage.MyAccommodationCalendarHeader.previousMonth']()}
		>
			<span class="icon-[lucide--chevron-left]" aria-hidden="true"></span>
		</RangeCalendar.PrevButton>

		<RangeCalendar.NextButton
			aria-label={m['MyAccommodationPage.MyAccommodationCalendarHeader.nextMonth']()}
		>
			<span class="icon-[lucide--chevron-right]" aria-hidden="true"></span>
		</RangeCalendar.NextButton>
	</div>
</RangeCalendar.Header>
