<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';
	import { displayCancellationPolicyPeriods } from '@/shared/features/accommodations/utils/displayCancellationPolicyPeriods.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();

	const facts = $derived([
		{
			icon: 'icon-[lucide--users]',
			label: m['AccommodationsFeature.AccommodationCard.guests'](),
			value: accommodation.maxGuests
		},
		{
			icon: 'icon-[lucide--door-closed]',
			label: m['AccommodationsFeature.AccommodationCard.bedrooms'](),
			value: accommodation.bedrooms
		},
		{
			icon: 'icon-[lucide--bed-double]',
			label: m['AccommodationsFeature.AccommodationCard.beds'](),
			value: accommodation.beds
		},
		{
			icon: 'icon-[lucide--bath]',
			label: m['AccommodationsFeature.AccommodationCard.bathrooms'](),
			value: accommodation.bathrooms
		}
	]);

	const fullRefund = $derived(
		displayCancellationPolicyPeriods(accommodation.cancellationPolicy).length === 1
	);

	// The three questions guests ask first, answered before they have to scroll.
	const highlights = $derived([
		{
			icon: 'icon-[lucide--log-in]',
			label: m['AccommodationPage.AccommodationDetailsRules.checkIn'](),
			value: `${accommodation.checkInStart} – ${accommodation.checkInEnd}`
		},
		{
			icon: 'icon-[lucide--log-out]',
			label: m['AccommodationPage.AccommodationDetailsRules.checkOut'](),
			value: accommodation.checkOut
		},
		{
			icon: 'icon-[lucide--shield-check]',
			label: m['BookingsFeature.BookingCancellationPolicy.title'](),
			value: fullRefund
				? m['AccommodationPage.CancellationPolicy.fullTitle']()
				: m['AccommodationPage.CancellationPolicy.customTitle']()
		}
	]);

	let descriptionElement: HTMLParagraphElement | undefined = $state();
	let isExpanded = $state(false);
	let isClamped = $state(false);

	// Only offer "Show more" when the text is actually cut off.
	$effect(() => {
		const element = descriptionElement;
		if (!element) return;

		const measure = () => {
			if (!isExpanded) isClamped = element.scrollHeight > element.clientHeight;
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	});
</script>

<section id="overview" class="scroll-mt-32 pb-9" aria-labelledby="overview-title">
	<h2 id="overview-title" class="text-2xl font-semibold tracking-tight">
		{m['AccommodationPage.AccommodationDetailsOverview.overview']()}
	</h2>

	<dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each facts as fact (fact.label)}
			<div class="flex flex-col gap-3 rounded-xl border p-4">
				<span class={cn(fact.icon, 'size-6')} aria-hidden="true"></span>
				<div>
					<dt class="text-sm text-muted-foreground">{fact.label}</dt>
					<dd class="text-xl font-semibold">{fact.value}</dd>
				</div>
			</div>
		{/each}
	</dl>

	<ul class="mt-8 grid divide-y rounded-xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
		{#each highlights as item (item.label)}
			<li class="flex items-start gap-3 p-4">
				<span
					class={cn(item.icon, 'mt-0.5 size-5 shrink-0 text-muted-foreground')}
					aria-hidden="true"
				></span>
				<div class="min-w-0">
					<p class="text-sm text-muted-foreground">{item.label}</p>
					<p class="mt-0.5 font-medium">{item.value}</p>
				</div>
			</li>
		{/each}
	</ul>

	<p class="mt-3 text-xs leading-5 text-muted-foreground">
		{m['AccommodationPage.AccommodationDetailsRules.localTime']()}
	</p>

	<div class="mt-8 max-w-prose">
		<p
			bind:this={descriptionElement}
			class={cn('text-base leading-7 whitespace-pre-line', !isExpanded && 'line-clamp-6')}
		>
			{accommodation.description}
		</p>

		{#if isClamped}
			<Button
				variant="outline"
				class="mt-4"
				aria-expanded={isExpanded}
				onclick={() => (isExpanded = !isExpanded)}
			>
				{isExpanded
					? m['AccommodationPage.AccommodationDetailsOverview.showLess']()
					: m['AccommodationPage.AccommodationDetailsOverview.showMore']()}
			</Button>
		{/if}
	</div>
</section>
