<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { booked }: { booked: boolean } = $props();

	const label = $derived(
		booked ? m['MyAccommodationPage.MyAccommodationCalendarBookedDay.booked']() : 'Airbnb'
	);
</script>

<span
	title={label}
	class={cn(
		'truncate rounded px-1 py-1.5 text-[10px] font-medium sm:text-xs',
		booked
			? 'bg-primary text-primary-foreground'
			: 'border border-primary/25 bg-primary/10 text-foreground'
	)}
>
	<span class="hidden sm:inline">{label}</span>
	<span
		class={cn(
			'mx-auto block size-3.5 sm:hidden',
			booked ? 'icon-[lucide--calendar-check]' : 'icon-[lucide--link]'
		)}
		aria-hidden="true"
	></span>
</span>
