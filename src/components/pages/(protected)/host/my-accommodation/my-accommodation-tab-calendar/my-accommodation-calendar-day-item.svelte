<script lang="ts">
	// CONFIG
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatCurrency } from '@/shared/utils/currency.js';

	let { day }: { day: number } = $props();
	const booked = $derived(day >= 5 && day <= 8);
	const imported = $derived(day >= 19 && day <= 22);
	const blocked = $derived(day >= 12 && day <= 14);
	const selected = $derived(day >= 26 && day <= 28);
	const status = $derived(
		booked
			? m['MyAccommodationPage.MyAccommodationCalendarDayItem.booked']()
			: imported
				? m['MyAccommodationPage.MyAccommodationCalendarDayItem.imported']()
				: blocked
					? m['MyAccommodationPage.MyAccommodationCalendarDayItem.blocked']()
					: selected
						? m['MyAccommodationPage.MyAccommodationCalendarDayItem.selected']()
						: m['MyAccommodationPage.MyAccommodationCalendarDayItem.available']()
	);
</script>

<td
	class={cn(
		'h-24 border-r border-b p-1.5 align-top last:border-r-0 sm:h-28 sm:p-2.5',
		blocked && 'bg-muted/70',
		selected && 'bg-primary/10'
	)}
>
	<div class="flex h-full flex-col justify-between gap-2">
		<span
			class={cn(
				'flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
				selected && 'bg-primary text-primary-foreground'
			)}
		>
			{day}
			<span class="sr-only">: {status}</span>
		</span>
		{#if booked || imported}
			<span
				title={booked
					? m['MyAccommodationPage.MyAccommodationCalendarDayItem.reservation']()
					: 'Airbnb'}
				class={cn(
					'truncate rounded px-1 py-1.5 text-[10px] font-medium sm:text-xs',
					booked
						? 'bg-primary text-primary-foreground'
						: 'border border-primary/25 bg-primary/10 text-foreground'
				)}
			>
				<span class="hidden sm:inline">
					{booked
						? m['MyAccommodationPage.MyAccommodationCalendarDayItem.reservation']()
						: 'Airbnb'}
				</span>
				<span
					class={cn(
						'mx-auto block size-3.5 sm:hidden',
						booked ? 'icon-[lucide--calendar-check]' : 'icon-[lucide--link]'
					)}
					aria-hidden="true"
				></span>
			</span>
		{:else if blocked}
			<span
				class="text-muted-foreground"
				title={m['MyAccommodationPage.MyAccommodationCalendarDayItem.ownerStay']()}
			>
				<span class="hidden text-xs sm:inline">
					{m['MyAccommodationPage.MyAccommodationCalendarDayItem.ownerStay']()}
				</span>
				<span
					class="mx-auto icon-[lucide--lock-keyhole] block size-3.5 sm:hidden"
					aria-hidden="true"
				></span>
			</span>
		{:else}
			<span class="text-[10px] text-muted-foreground tabular-nums sm:text-sm">
				{formatCurrency(8500, getLocale())}
			</span>
		{/if}
	</div>
</td>
