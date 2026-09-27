<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let { onopen }: { onopen: () => void } = $props();

	const search = getSearchContext();
</script>

<Button variant={search.activeFilters.length ? 'secondary' : 'outline'} onclick={onopen}
	><span class="icon-[lucide--sliders-horizontal]" aria-hidden="true"></span>{m[
		'SearchPage.SearchFilters.filters'
	]()}{search.activeFilters.length ? ` (${search.activeFilters.length})` : ''}</Button
>
