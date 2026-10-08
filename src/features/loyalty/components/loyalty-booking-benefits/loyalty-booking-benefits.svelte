<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import type { LoyaltyBookingBenefits } from '@/shared/features/loyalty/types/loyaltyTypes.js';
	let {
		benefits,
		showGuestCount = true
	}: { benefits: LoyaltyBookingBenefits; showGuestCount?: boolean } = $props();
</script>

<section
	class="flex flex-col gap-3 text-sm"
	aria-label={m['LoyaltyFeature.BookingBenefits.title']()}
>
	<h3 class="font-medium">
		{m['LoyaltyFeature.BookingBenefits.level']({ level: benefits.level })}
	</h3>
	{#if benefits.loyaltyDiscountBps === 0}
		<p class="text-xs leading-5 text-muted-foreground">
			{m['LoyaltyFeature.BookingBenefits.propertyOffer']()}
		</p>
	{/if}
	<ul class="flex flex-col gap-2">
		{#if benefits.parking}
			<li class="flex items-center gap-2">
				<span class="icon-[lucide--car-front] size-4 shrink-0" aria-hidden="true"></span>
				{m['LoyaltyFeature.BookingBenefits.parking']()}
			</li>
		{/if}
		{#if benefits.breakfast !== 'none'}
			<li class="flex items-start gap-2">
				<span class="mt-0.5 icon-[lucide--coffee] size-4 shrink-0" aria-hidden="true"></span>
				<div class="flex flex-col gap-1">
					<p>
						{benefits.breakfast === 'all'
							? m['LoyaltyFeature.BookingBenefits.breakfastAll']()
							: m['LoyaltyFeature.BookingBenefits.breakfastTwo']()}
					</p>
					{#if showGuestCount}
						<p class="text-xs text-muted-foreground">
							{m['LoyaltyFeature.BookingBenefits.breakfastCoverage']()}
							<Plural
								count={benefits.breakfastGuests}
								locale={getLocale()}
								forms={{
									one: m['LoyaltyFeature.BookingBenefits.guest'](),
									other: m['LoyaltyFeature.BookingBenefits.guests']()
								}}
							/>
						</p>
					{/if}
				</div>
			</li>
		{/if}
		{#if benefits.spa}
			<li class="flex items-center gap-2">
				<span class="icon-[lucide--waves] size-4 shrink-0" aria-hidden="true"></span>
				{m['LoyaltyFeature.BookingBenefits.spa']()}
			</li>
		{/if}
	</ul>
</section>
