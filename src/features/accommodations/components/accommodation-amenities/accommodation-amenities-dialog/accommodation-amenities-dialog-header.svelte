<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import SearchInput from '@/features/search/components/search-input.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { AmenityDialog } from '@/features/accommodations/hooks/useAmenityDialog.svelte.js';

	let {
		dialog,
		titleId,
		dialogId
	}: {
		dialog: AmenityDialog;
		titleId: string;
		dialogId: string;
	} = $props();
</script>

<header class="flex shrink-0 flex-col gap-5 border-b px-5 pt-5 pb-4 md:px-8 md:pt-7">
	<div class="flex items-center justify-between gap-3">
		<h2 id={titleId} class="text-xl font-semibold">
			{m['AddAccommodationPage.AccommodationProgress.amenities']()}
		</h2>
		<Button
			type="button"
			variant="ghost"
			size="icon"
			commandfor={dialogId}
			command="close"
			aria-label={m['AccommodationsFeature.AccommodationAmenitiesDialogHeader.close']()}
		>
			<span class="icon-[lucide--x]" aria-hidden="true"></span>
		</Button>
	</div>
	<SearchInput
		bind:value={dialog.state.search}
		placeholder={m['AccommodationsFeature.AccommodationAmenitiesDialogHeader.search']()}
		onkeydown={(event) => {
			if (event.key === 'Enter') event.preventDefault();
		}}
	/>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<span class="text-sm text-muted-foreground tabular-nums" role="status">
			{m['AccommodationsFeature.AccommodationAmenitiesDialogHeader.selected']({
				count: dialog.state.draft.length
			})}
		</span>
		<Button
			type="button"
			variant="ghost"
			size="sm"
			aria-pressed={dialog.state.selectedOnly}
			onclick={dialog.toggleSelectedOnly}
		>
			{dialog.state.selectedOnly
				? m['AccommodationsFeature.AccommodationAmenitiesDialogHeader.viewAll']()
				: m['AccommodationsFeature.AccommodationAmenitiesDialogHeader.viewSelected']()}
		</Button>
	</div>
</header>
