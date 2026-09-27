<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import AccommodationGalleryItem from './accommodation-gallery-item.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { images, name, open }: { images: string[]; name: string; open: () => void } = $props();
</script>

<div class="relative overflow-hidden rounded-2xl bg-muted">
	<div
		class={cn(
			'grid h-72 grid-cols-2 grid-rows-2 gap-2 sm:h-96 lg:h-120',
			images.length >= 5 ? 'md:grid-cols-4' : images.length >= 3 && 'md:grid-cols-3'
		)}
	>
		{#each images.slice(0, images.length >= 5 ? 5 : images.length >= 3 ? 3 : 1) as src, index (index)}
			<AccommodationGalleryItem
				{src}
				{index}
				alt={m['AccommodationPage.AccommodationGalleryDialogTrigger.photoAlt']({
					name,
					number: index + 1
				})}
			/>
		{/each}
	</div>

	<Button variant="secondary" class="absolute right-4 bottom-4 min-h-11 shadow-sm" onclick={open}>
		<span class="icon-[lucide--images]" data-icon="inline-start" aria-hidden="true"></span>
		{m['AccommodationPage.AccommodationGalleryDialogTrigger.showPhotos']({ count: images.length })}
	</Button>
</div>
