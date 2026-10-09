<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { LOYALTY_CONFIG } from '@/shared/features/loyalty/config.js';

	// COMPONENTS
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section.svelte';
	import FeaturedAccommodationsSection from '@/components/pages/(unprotected)/root/featured-accommodations-section/featured-accommodations-section.svelte';
	import LoyaltySection from '@/components/pages/(unprotected)/root/loyalty-section/loyalty-section.svelte';
	import TestimonialsSection from '@/components/pages/(unprotected)/root/testimonials-section.svelte';
	import NewslettersSection from '@/features/newsletters/components/newsletters-section/newsletters-section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead
	title={m['HomePage.title']()}
	description={m['HomePage.description']()}
	suffixSiteName={false}
/>

<HeroSection />

{#if LOYALTY_CONFIG.BOOKING_ENABLED}
	<FeaturedAccommodationsSection />
	<LoyaltySection />
{/if}

<TestimonialsSection />

<NewslettersSection />
