<script lang="ts">
	// CONVEX
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	const search = useSearch();
	const suggestions = useQuery(
		api.search.queries.fetchSearchSuggestions.fetchSearchSuggestions,
		() => (search.isActive ? { search: search.term } : 'skip')
	);

	const dropdownOpen = $derived(search.isActive && (suggestions.data?.length ?? 0) > 0);
</script>

<SvelteHead title="Search test" noindex />

<Section>
	<div class="flex flex-col gap-3">
		<h1 class="text-2xl font-semibold">Search dropdown</h1>
		<p class="text-muted-foreground">
			Type at least two characters. Suggestions match from the beginning and are limited to seven.
		</p>

		<SearchInput
			bind:value={search.value}
			label="Search suggestions"
			placeholder="Try Tapuskovic..."
			{dropdownOpen}
			class="max-w-md"
		>
			{#snippet dropdown()}
				{#each suggestions.data ?? [] as suggestion (suggestion.id)}
					<button
						type="button"
						role="option"
						aria-selected="false"
						class="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
						onclick={() => (search.value = suggestion.label)}
					>
						{suggestion.label}
					</button>
				{/each}
			{/snippet}
		</SearchInput>

		{#if search.isActive && suggestions.error}
			<ErrorComponent message="Couldn't load suggestions." class="py-2" />
		{/if}
	</div>
</Section>
