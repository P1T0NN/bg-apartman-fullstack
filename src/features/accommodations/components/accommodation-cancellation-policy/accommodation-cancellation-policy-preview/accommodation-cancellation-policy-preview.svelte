<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ACCOMMODATION_CONFIG } from '@/shared/features/accommodations/config.js';

	// COMPONENTS
	import AccommodationCancellationPolicyPreviewItem from './accommodation-cancellation-policy-preview-item.svelte';

	// SCHEMAS
	import { cancellationPolicySchema } from '@/shared/features/accommodations/schemas/cancellationPolicySchemas.js';

	// TYPES
	import type { FormValue } from '@/components/ui/custom-components/form/formTypes.js';

	let { policy, title }: { policy: FormValue; title?: string } = $props();

	const uid = $props.id();

	const validation = $derived(cancellationPolicySchema.safeParse(policy));
</script>

<section aria-labelledby={`${uid}-preview`} class="flex flex-col gap-3 border-t pt-5">
	<h3 id={`${uid}-preview`} class="font-medium">
		{title ?? m['AccommodationsFeature.AccommodationCancellationPolicyPreview.previewTitle']()}
	</h3>

	{#if validation.success}
		{#if validation.data.mode === 'full_refund'}
			<p class="text-sm">
				{m['AccommodationsFeature.AccommodationCancellationPolicyPreview.fullRefundPreview']()}
			</p>
		{:else}
			<p class="text-sm text-muted-foreground">
				{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.timeBeforeCheckIn']()}
			</p>

			<dl class="flex flex-col gap-3 text-sm">
				<div class="grid gap-1 sm:grid-cols-2">
					<dt>
						{m['AccommodationsFeature.AccommodationCancellationPolicyCustom.sevenDaysOrMore']()}
					</dt>

					<dd>{m['AccommodationsFeature.AccommodationCancellationPolicyItem.refund100']()}</dd>
				</div>

				{#each ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES as range (range)}
					<AccommodationCancellationPolicyPreviewItem {range} percentage={validation.data[range]} />
				{/each}
			</dl>
		{/if}

		<p class="text-sm text-muted-foreground">
			{m['AccommodationsFeature.AccommodationCancellationPolicyPreview.cancellationAllowed']()}
		</p>
	{:else}
		<p class="text-sm text-muted-foreground">
			{m['AccommodationsFeature.AccommodationCancellationPolicyPreview.invalidPreview']()}
		</p>
	{/if}

	<p class="text-sm text-muted-foreground">
		{m['AccommodationsFeature.AccommodationCancellationPolicyPreview.noPayment']()}
	</p>
</section>
