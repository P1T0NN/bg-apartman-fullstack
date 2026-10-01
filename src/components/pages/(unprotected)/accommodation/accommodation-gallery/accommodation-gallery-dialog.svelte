<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import ImageGalleryBig from '@/components/ui/custom-components/image-gallery/image-gallery-big.svelte';

	let { images, name, dialogId }: { images: string[]; name: string; dialogId: string } = $props();
</script>

<div class="mb-4 flex items-center justify-between gap-4">
	<h2 id="accommodation-photos-title" class="text-lg font-semibold">{name}</h2>

	<Button variant="outline" commandfor={dialogId} command="close">
		{m['AccommodationPage.AccommodationGalleryDialog.close']()}
	</Button>
</div>

<ImageGalleryBig {images} alt={name} />
