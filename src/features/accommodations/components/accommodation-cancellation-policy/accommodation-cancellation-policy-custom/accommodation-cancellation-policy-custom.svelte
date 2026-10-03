<script lang="ts">
	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import AccommodationCancellationPolicyItem from './accommodation-cancellation-policy-item.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';
	import { ACCOMMODATION_CONFIG } from '@/shared/features/accommodations/config.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const uid = $props.id();
</script>

<Field.Set disabled={context.disabled} aria-describedby={`${uid}-ranges-hint ${uid}-boundary-hint`}>
	<Field.Legend variant="label">
		{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.cancellationTime']()}
	</Field.Legend>

	<Field.Description id={`${uid}-ranges-hint`}>
		{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.timeBeforeCheckIn']()}
	</Field.Description>

	<Field.Description>
		{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.rangesHint']()}
	</Field.Description>

	<div class="grid gap-2 border-b pb-4 text-sm sm:grid-cols-2">
		<div class="flex flex-col gap-1">
			<p>{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.sevenDaysOrMore']()}</p>
			<p class="text-muted-foreground">
				{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.sevenDaysExample']()}
			</p>
		</div>
		<p>{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.fixedRefund']()}</p>
	</div>

	<Field.Group>
		{#each ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES as range (range)}
			<AccommodationCancellationPolicyItem {range} {context} />
		{/each}
	</Field.Group>

	<Field.Description id={`${uid}-boundary-hint`}>
		{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.boundaryHint']()}
	</Field.Description>
</Field.Set>
