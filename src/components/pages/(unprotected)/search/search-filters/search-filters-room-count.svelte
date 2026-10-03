<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let {
		field,
		value = $bindable()
	}: {
		field: 'bedrooms' | 'beds' | 'bathrooms';
		value: number;
	} = $props();

	const uid = $props.id();

	const label = $derived(
		{
			bedrooms: m['SearchPage.SearchFiltersRoomCount.bedrooms'](),
			beds: m['SearchPage.SearchFiltersRoomCount.beds'](),
			bathrooms: m['SearchPage.SearchFiltersRoomCount.bathrooms']()
		}[field]
	);
</script>

<fieldset id={`${uid}-${field}`} class="scroll-mt-24">
	<legend class="mb-3 font-semibold">{label}</legend>

	<div class="flex flex-wrap gap-2">
		{#each [0, 1, 2, 3, 4, 5] as number (number)}
			<Button
				type="button"
				variant={value === number ? 'default' : 'outline'}
				aria-pressed={value === number}
				onclick={() => (value = number)}
			>
				{number ? `${number}+` : m['SearchPage.SearchFiltersRoomCount.any']()}
			</Button>
		{/each}
	</div>
</fieldset>
