<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages';

	let { disabled = false }: { disabled?: boolean } = $props();
	const form = getAccommodationFormContext();
</script>

<Button type="submit" disabled={disabled || form.state.submitting}>
	{#if form.state.submitting}
		<Spinner />
	{/if}
	{m['AddAccommodationPage.AddAccommodationSaveButton.save']()}
</Button>
