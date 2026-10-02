<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// HOOKS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { StaySearch } from '@/shared/features/search/types/searchTypes.js';

	let {
		draft,
		close,
		invalid = $bindable()
	}: { draft: StaySearch; close: () => void; invalid: boolean } = $props();

	const search = getSearchContext();

	function apply(button: HTMLElement): void {
		if (!button.closest('form')?.reportValidity()) return;

		invalid = Boolean(draft.maxPrice && draft.maxPrice < draft.minPrice);
		if (invalid) return;

		search.setCriteria(draft);
		close();
	}
</script>

<Button type="button" onclick={(event) => apply(event.currentTarget)}>
	{m['SearchPage.SearchFiltersApplyButton.show']()}
</Button>
