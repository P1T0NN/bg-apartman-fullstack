<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { AmenityDialog } from '@/features/accommodations/hooks/useAmenityDialog.svelte.js';

	let {
		dialog,
		disabled = false,
		dialogId
	}: {
		dialog: AmenityDialog;
		disabled?: boolean;
		dialogId: string;
	} = $props();
</script>

<footer
	class="flex shrink-0 items-center justify-end gap-3 border-t px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8"
>
	<Button type="button" variant="outline" commandfor={dialogId} command="close">
		{m['AccommodationsFeature.AccommodationAmenitiesDialogFooter.cancel']()}
	</Button>
	<Button
		type="button"
		class="flex-1 md:flex-none"
		{disabled}
		onclick={dialog.save}
		commandfor={dialogId}
		command="close"
	>
		{m['AccommodationsFeature.AccommodationAmenitiesDialogFooter.save']()}
	</Button>
</footer>
