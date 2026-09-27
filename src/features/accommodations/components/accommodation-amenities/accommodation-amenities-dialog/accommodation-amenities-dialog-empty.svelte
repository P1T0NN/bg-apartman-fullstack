<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Empty from '@/components/ui/empty/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { AmenityDialog } from '@/features/accommodations/hooks/useAmenityDialog.svelte.js';

	let { dialog }: { dialog: AmenityDialog } = $props();

	const query = $derived(dialog.state.search.trim().toLocaleLowerCase());
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon"
			><span class="icon-[lucide--search]" aria-hidden="true"></span></Empty.Media
		>
		<Empty.Title
			>{query
				? m['AccommodationsFeature.AccommodationAmenitiesDialogEmpty.noMatches']()
				: m['AccommodationsFeature.AccommodationAmenitiesDialogEmpty.noneSelected']()}</Empty.Title
		>
		<Empty.Description
			>{m['AccommodationsFeature.AccommodationAmenitiesDialogEmpty.emptyHint']()}</Empty.Description
		>
	</Empty.Header>
	<Empty.Content>
		<Button type="button" variant="outline" onclick={dialog.resetFilters}>
			{m['AccommodationsFeature.AccommodationAmenitiesDialogEmpty.viewAll']()}
		</Button>
	</Empty.Content>
</Empty.Root>
