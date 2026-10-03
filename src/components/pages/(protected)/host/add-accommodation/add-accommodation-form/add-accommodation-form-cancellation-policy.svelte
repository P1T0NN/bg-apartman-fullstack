<script lang="ts">
	// COMPONENTS
	import AccommodationCancellationPolicy from '@/features/accommodations/components/accommodation-cancellation-policy/accommodation-cancellation-policy.svelte';
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const form = getAccommodationFormContext();
</script>

<AccommodationCancellationPolicy {context} />

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}>
		{m['AddAccommodationPage.AddAccommodationFormCancellationPolicy.previous']()}
	</Button>

	<AddAccommodationContinueButton errors={context.errors} />
</div>
