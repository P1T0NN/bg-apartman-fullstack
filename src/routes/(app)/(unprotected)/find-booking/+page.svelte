<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';

	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import FindBookingHeader from '@/components/pages/(unprotected)/find-booking/find-booking-header.svelte';
	import FindBookingForm from '@/components/pages/(unprotected)/find-booking/find-booking-form.svelte';
	import FindBookingDetails from '@/components/pages/(unprotected)/find-booking/find-booking-details.svelte';

	const params = useSearchParams(['token']);
	const token = $derived(params.get('token'));
</script>

<SvelteHead
	title={m['FindBookingPage.FindBookingHeader.title']()}
	description={m['FindBookingPage.FindBookingHeader.description']()}
	noindex
/>

<svelte:head><meta name="referrer" content="no-referrer" /></svelte:head>

<Section class="py-10 sm:py-16">
	<FindBookingHeader />

	{#if token}
		{#key token}
			<FindBookingDetails {token} />
		{/key}
	{:else}
		<FindBookingForm />
	{/if}
</Section>
