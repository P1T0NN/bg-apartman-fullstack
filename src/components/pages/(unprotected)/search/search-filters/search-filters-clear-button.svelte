<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { clearSearchFilters } from '@/shared/features/search/utils/clearSearchFilters.js';

	// TYPES
	import type { StaySearch } from '@/shared/features/search/types/searchTypes.js';

	let { draft = $bindable() }: { draft: StaySearch } = $props();
</script>

<Button type="button" variant="ghost" onclick={() => (draft = clearSearchFilters(draft))}>
	{m['SearchPage.SearchFiltersClearButton.clear']()}
</Button>
