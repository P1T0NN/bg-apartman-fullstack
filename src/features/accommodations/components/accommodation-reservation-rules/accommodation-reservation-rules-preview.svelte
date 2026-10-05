<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { FormValues } from '@/components/ui/custom-components/form/formTypes.js';

	let { values }: { values: FormValues } = $props();
</script>

<div class="flex flex-col gap-2 text-sm leading-6">
	<p class="font-medium">
		{m['AccommodationsFeature.ReservationRulesHost.sameDayLabel']()}:
		{values.sameDayReservation
			? m['AccommodationsFeature.AccommodationRuleCard.enabled']()
			: m['AccommodationsFeature.AccommodationRuleCard.disabled']()}
	</p>
	<p class="text-muted-foreground">
		{m['AccommodationsFeature.ReservationRulesHost.sameDayHint']()}
		{m['AccommodationsFeature.ReservationRulesHost.sameDayLimitations']()}
	</p>
</div>
