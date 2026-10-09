<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

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
		<p class="text-sm font-medium">
			{m[`CancellationPolicies.${validation.data.mode}`]()}
		</p>
		<p class="text-sm">
			{m[`CancellationPolicies.${validation.data.mode}Description`]()}
		</p>
		<p class="text-sm text-muted-foreground">
			{m['CancellationPolicies.inclusiveDeadline']()}
		</p>

		<p class="text-sm text-muted-foreground">
			{m['AccommodationsFeature.AccommodationCancellationPolicyPreview.cancellationAllowed']()}
		</p>
	{:else}
		<p class="text-sm text-muted-foreground">
			{m['CancellationPolicies.choosePreset']()}
		</p>
	{/if}

	<p class="text-sm text-muted-foreground">
		{m['AccommodationsFeature.AccommodationCancellationPolicyPreview.noPayment']()}
	</p>
</section>
