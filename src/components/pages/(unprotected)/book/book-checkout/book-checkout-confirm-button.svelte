<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		submitting = false,
		mode = 'request',
		onclick,
		class: className
	}: {
		submitting?: boolean;
		mode?: 'request' | 'instant';
		onclick: () => Promise<void>;
		class?: string;
	} = $props();
</script>

<Button
	type="button"
	{onclick}
	size="lg"
	class={cn('mt-6 min-h-12 w-full sm:w-auto', className)}
	disabled={submitting}
>
	{#if submitting}
		<Spinner />
	{/if}

	{mode === 'instant'
		? m['AccommodationsFeature.BookingMode.bookInstantly']()
		: m['BookingPage.BookCheckoutConfirmButton.confirm']()}
</Button>
