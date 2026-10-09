<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Switch } from '@/components/ui/switch/index.js';

	// TYPES
	import type { LoyaltyTier } from '@/shared/features/loyalty/types/loyaltyTypes.js';

	let {
		level,
		active,
		disabled = false,
		onToggle
	}: {
		level: LoyaltyTier;
		active: boolean;
		disabled?: boolean;
		onToggle: (next: boolean) => void;
	} = $props();

	const switchId = $props.id();

	const benefits = $derived(
		[
			level.parking ? m['LoyaltyFeature.BookingBenefits.parking']() : null,
			level.breakfast === 'up_to_two'
				? m['LoyaltyFeature.BookingBenefits.breakfastTwo']()
				: level.breakfast === 'all'
					? m['LoyaltyFeature.BookingBenefits.breakfastAll']()
					: null,
			level.spa ? m['LoyaltyFeature.BookingBenefits.spa']() : null
		].filter((benefit) => benefit !== null)
	);
</script>

<Card.Root size="sm">
	<Card.Content class="flex items-center justify-between gap-4">
		<div class="flex flex-col gap-1">
			<label for={switchId} class="cursor-pointer text-sm font-medium">
				{m['AdminAccommodationsPage.AdminAccommodationsLoyaltyDialog.levelTitle']({
					level: level.level
				})}
			</label>
			<p class="text-sm text-muted-foreground">{benefits.join(' · ')}</p>
		</div>

		<Switch
			id={switchId}
			checked={active}
			{disabled}
			onCheckedChange={(checked) => onToggle(checked)}
		/>
	</Card.Content>
</Card.Root>
