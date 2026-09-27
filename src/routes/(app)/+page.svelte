<script lang="ts">
	// COMPONENTS
	import SearchCard from '@/components/ui/custom-components/search-card/search-card.svelte';
	import NewslettersSection from '@/features/newsletters/components/newsletters-section/newsletters-section.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Home" />

<Section>
	<SearchCard />
</Section>

<NewslettersSection />
