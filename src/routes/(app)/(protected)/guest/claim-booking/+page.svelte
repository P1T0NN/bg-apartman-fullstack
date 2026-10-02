<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	
	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import ClaimBookingHeader from '@/components/pages/(protected)/guest/claim-booking/claim-booking-header.svelte';
	import ClaimBookingContent from '@/components/pages/(protected)/guest/claim-booking/claim-booking-content.svelte';
</script>

<SvelteHead title={m['ClaimBookingPage.ClaimBookingHeader.title']()} noindex />

<svelte:head>
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<div class="flex w-full flex-col gap-6">
	<ClaimBookingHeader />

	<ClaimBookingContent />
</div>
