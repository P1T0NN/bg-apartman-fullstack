<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const search = getSearchContext();
</script>

<div class="hidden flex-wrap gap-2 sm:flex">
	<Button variant="outline">{m['SearchPage.SearchFilters.price']()}</Button>
	<Button variant="outline">{search.labels.type}</Button>
	<Button variant="outline">{search.labels.bedrooms}</Button>
	<Button variant="outline">{search.labels.rating}</Button>
	<Button variant="outline">{search.labels.amenities}</Button>
</div>
