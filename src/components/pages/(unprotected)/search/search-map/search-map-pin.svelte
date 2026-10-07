<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// COMPONENTS
	import AccommodationCardPreview from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';

	// HOOKS
	import { usePopoverPlacement } from '@/components/ui/native-components/native-popover/usePopoverPlacement.svelte.js';

	// UTILS
	import { formatCompactCurrency } from '@/shared/utils/currency.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { AccommodationCard } from '@/shared/features/accommodations/types/accommodationTypes.js';

	// LUCIDE ICONS
	import X from '@lucide/svelte/icons/x';

	let {
		accommodation,
		isHighlighted
	}: {
		accommodation: AccommodationCard;
		isHighlighted: () => boolean;
	} = $props();

	// Card panel is `w-80 p-3`; the height estimate only drives the flip decision.
	const PANEL_WIDTH = 320;
	const PANEL_HEIGHT = 380;

	const popoverId = $props.id();
	const placement = usePopoverPlacement({
		getSize: () => ({ width: PANEL_WIDTH, height: PANEL_HEIGHT }),
		getBounds: (trigger) =>
			trigger.closest<HTMLElement>('[role="region"]')?.getBoundingClientRect() ?? null
	});
	const highlighted = $derived(isHighlighted() || placement.open);

	function closeCard(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }): void {
		const popover = event.currentTarget.closest<HTMLElement>('[popover]');
		if (popover?.matches(':popover-open')) popover.hidePopover();
	}
</script>

{#snippet pin()}
	<span
		class={cn(
			'flex min-w-11 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-md transition-colors',
			highlighted
				? 'border-primary bg-primary text-primary-foreground'
				: 'border-border bg-background text-foreground'
		)}
	>
		{formatCompactCurrency(accommodation.effectivePricePerNightMinor, getLocale())}
	</span>
	<span
		class={cn(
			'-mt-1.5 size-2.5 rotate-45 border-r border-b transition-colors',
			highlighted ? 'border-primary bg-primary' : 'border-border bg-background'
		)}
	></span>
{/snippet}

{#snippet close()}
	<button
		type="button"
		class="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 shadow-sm backdrop-blur transition-colors hover:bg-background"
		aria-label={m['SearchPage.SearchStay.close']()}
		onclick={closeCard}
	>
		<X class="size-5 text-foreground" aria-hidden="true" />
	</button>
{/snippet}

<NativePopover
	id={popoverId}
	trigger={pin}
	triggerLabel={accommodation.name}
	triggerClass="flex flex-col items-center"
	side={placement.side}
	align={placement.align}
	class="w-80 p-3"
>
	<span class="hidden" {@attach placement.watch}></span>
	{#if placement.open}
		<AccommodationCardPreview {accommodation} {close} />
	{/if}
</NativePopover>
