<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import { useLoyaltyQuote } from '@/features/loyalty/hooks/useLoyaltyQuote.svelte.js';
	import LoyaltyBookingBenefits from '../loyalty-booking-benefits/loyalty-booking-benefits.svelte';
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	let { accommodation }: { accommodation: PublicAccommodation } = $props();
	const loyalty = useLoyaltyQuote({
		accommodation: () => accommodation,
		checkInDate: () => '',
		checkOutDate: () => '',
		guests: () => 1
	});
</script>

{#if loyalty.quote.benefits}
	<div class="flex flex-col gap-3 py-8">
		<p class="font-semibold">{m['LoyaltyFeature.PropertyBenefits.title']()}</p>
		{#if loyalty.quote.benefits.loyaltyDiscountBps > 0}
			<p class="text-sm">
				{m['LoyaltyFeature.PropertyBenefits.discount']({
					percent: loyalty.quote.benefits.loyaltyDiscountBps / 100
				})}
			</p>
		{/if}
		<LoyaltyBookingBenefits benefits={loyalty.quote.benefits} showGuestCount={false} />
		<p class="text-xs leading-5 text-muted-foreground">
			{m['LoyaltyFeature.PropertyBenefits.payment']()}
		</p>
	</div>
{/if}
