<script lang="ts">
	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import AccommodationCancellationPolicyModeItem from './accommodation-cancellation-policy-mode-item.svelte';
	import AccommodationCancellationPolicyPreview from './accommodation-cancellation-policy-preview/accommodation-cancellation-policy-preview.svelte';

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
	const modes = ACCOMMODATION_CONFIG.CANCELLATION_POLICY_MODES;
	const mode = $derived(context.inputValue('cancellationPolicy.mode'));
</script>

<Field.Group>
	<Field.Set disabled={context.disabled} aria-describedby={`${uid}-mode-hint`}>
		<Field.Legend variant="label">
			{m['AccommodationsFeature.AccommodationCancellationPolicy.chooseMode']()}
		</Field.Legend>

		<Field.Description id={`${uid}-mode-hint`}>
			{m['AccommodationsFeature.AccommodationCancellationPolicy.modeHint']()}
		</Field.Description>

		<Field.Group>
			{#each modes as mode (mode)}
				<AccommodationCancellationPolicyModeItem
					{mode}
					{context}
					groupName={`${uid}-policy-mode`}
				/>
			{/each}
		</Field.Group>
	</Field.Set>

	{#if mode === 'custom' || mode === 'full_refund'}
		<p class="text-sm text-muted-foreground" role="status">
			{m['CancellationPolicies.legacySelection']()}
		</p>
	{/if}

	<AccommodationCancellationPolicyPreview policy={context.getValue('cancellationPolicy')} />
</Field.Group>
