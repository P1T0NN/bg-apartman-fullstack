<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let { submitting = false }: { submitting?: boolean } = $props();
</script>

<Button type="submit" size="lg" class="mt-6 min-h-12 w-full sm:w-auto" disabled={submitting}>
	{#if submitting}
		<Spinner />
	{/if}
	{m['BookingPage.BookingCheckout.confirm']()}
</Button>
