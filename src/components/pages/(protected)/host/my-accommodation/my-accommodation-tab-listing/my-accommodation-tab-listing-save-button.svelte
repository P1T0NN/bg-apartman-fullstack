<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let { submitting = false }: { submitting?: boolean } = $props();
</script>

<Button type="submit" disabled={submitting}>
	{#if submitting}
		<Spinner />
	{/if}

	{m['MyAccommodationPage.MyAccommodationTabListingSaveButton.save']()}
</Button>
