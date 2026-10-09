<script lang="ts">
	// LIBRARIES
	import { getLocalTimeZone, today } from '@internationalized/date';

	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import RangeCalendar from '@/components/ui/range-calendar/range-calendar.svelte';

	// HOOKS
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';

	const MIN_DATE = today(getLocalTimeZone());

	const isMobile = new IsMobile();

	const uid = $props.id();
	const calendarId = `home-stay-dates-${uid}`;

	let {
		value = $bindable<DateRange | undefined>(),
		dark = false
	}: { value?: DateRange; dark?: boolean } = $props();

	const stayDatesLabel = $derived.by(() => {
		const start = value?.start;
		const end = value?.end;
		if (!start) return m['Components.SearchCardStayDates.selectDates']();

		const formatter = new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric' });
		const startLabel = formatter.format(start.toDate(getLocalTimeZone()));
		if (!end) return startLabel;

		return `${startLabel} - ${formatter.format(end.toDate(getLocalTimeZone()))}`;
	});

	function closeCalendar(): void {
		const popover = document.getElementById(calendarId);
		if (popover?.matches(':popover-open')) popover.hidePopover();
	}

	function handleRangeChange(next: DateRange): void {
		const hasCompleteRange = Boolean(next.start && next.end);
		if (hasCompleteRange) closeCalendar();
	}
</script>

{#snippet datesTrigger()}
	<span
		class={cn(
			'icon-[lucide--calendar] size-4 shrink-0',
			dark ? 'text-header-foreground/60' : 'text-muted-foreground'
		)}
	></span>
	<span
		class={cn(
			'truncate',
			!value?.start && (dark ? 'text-header-foreground/60' : 'text-muted-foreground')
		)}
	>
		{stayDatesLabel}
	</span>
{/snippet}

<Field.Field>
	<Field.Label>{m['Components.SearchCardStayDates.stayDates']()}</Field.Label>
	<NativePopover
		id={calendarId}
		trigger={datesTrigger}
		triggerLabel={m['Components.SearchCardStayDates.stayDates']()}
		triggerClass={cn(
			'h-9 w-full justify-start gap-2 rounded-3xl border border-transparent px-3 text-sm font-normal transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
			dark ? 'bg-header-foreground/10 text-header-foreground' : 'bg-input/50'
		)}
		class={cn('w-fit! p-0', dark && 'dark')}
	>
		<RangeCalendar
			bind:value
			locale={getLocale()}
			minValue={MIN_DATE}
			numberOfMonths={isMobile.current ? 1 : 2}
			fixedWeeks
			onValueChange={handleRangeChange}
			class={dark
				? 'bg-transparent dark:[&_[data-range-middle]]:text-accent-foreground'
				: undefined}
		/>
	</NativePopover>
</Field.Field>
