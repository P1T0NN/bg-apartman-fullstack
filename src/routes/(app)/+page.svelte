<script lang="ts">
	// COMPONENTS
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section.svelte';
	import NewslettersSection from '@/features/newsletters/components/newsletters-section/newsletters-section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<SvelteHead
	title={m['HomePage.title']()}
	description={m['HomePage.description']()}
	suffixSiteName={false}
/>

<HeroSection />

<NewslettersSection />
