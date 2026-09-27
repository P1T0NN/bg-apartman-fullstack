<script lang="ts">
	// COMPONENTS
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import AccommodationAmenities from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities.svelte';
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

<AccommodationAmenities {context} />

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}>
		{m['AddAccommodationPage.AddAccommodationFormAmenities.previous']()}
	</Button>

	<AddAccommodationContinueButton errors={context.errors} />
</div>
