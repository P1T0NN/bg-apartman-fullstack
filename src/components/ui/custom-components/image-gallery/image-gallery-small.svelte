<script lang="ts">
	// LIBRARIES
	import { onDestroy } from 'svelte';

	// COMPONENTS
	import * as Carousel from '@/components/ui/carousel/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { CarouselAPI } from '@/components/ui/carousel/context.js';

	type Props = {
		images: readonly string[];
		alt: string;
		class?: string;
	};

	let { images = [], alt, class: className }: Props = $props();

	let api = $state<CarouselAPI>();
	let activeIndex = $state(0);

	function setCarouselApi(nextApi: CarouselAPI | undefined): void {
		api?.off('select', updateActiveIndex);
		api = nextApi;
		if (!api) return;

		updateActiveIndex();
		api.on('select', updateActiveIndex);
	}

	function updateActiveIndex(): void {
		activeIndex = api?.selectedScrollSnap() ?? 0;
	}

	onDestroy(() => api?.off('select', updateActiveIndex));
</script>

<div class={cn('group relative w-full overflow-hidden rounded-2xl bg-muted', className)}>
	{#if images.length}
		<Carousel.Root
			setApi={setCarouselApi}
			opts={{ loop: true }}
			class="relative w-full"
			aria-label={m['Components.ImageGallerySmall.carouselLabel']()}
		>
			<Carousel.Content class="ms-0">
				{#each images as image, index (index)}
					<Carousel.Item class="ps-0" aria-hidden={index === activeIndex ? undefined : true}>
						<img
							src={image}
							alt={index === activeIndex ? alt : ''}
							class="aspect-[4/3] w-full object-cover"
							loading={index === 0 ? 'eager' : 'lazy'}
							decoding="async"
						/>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>
	{:else}
		<div class="flex aspect-[4/3] w-full items-center justify-center">
			<span class="icon-[lucide--image-off] size-6 text-muted-foreground" aria-hidden="true"></span>
		</div>
	{/if}

	{#if images.length > 1}
		<button
			type="button"
			class="absolute inset-y-0 left-2 z-10 my-auto flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
			aria-label={m['Components.ImageGallerySmall.previousImage']()}
			onclick={() => api?.scrollPrev()}
		>
			<span class="icon-[lucide--chevron-left] size-4" aria-hidden="true"></span>
		</button>

		<button
			type="button"
			class="absolute inset-y-0 right-2 z-10 my-auto flex size-8 cursor-pointer items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
			aria-label={m['Components.ImageGallerySmall.nextImage']()}
			onclick={() => api?.scrollNext()}
		>
			<span class="icon-[lucide--chevron-right] size-4" aria-hidden="true"></span>
		</button>

		<div class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center">
			{#each images as image, index (image)}
				<button
					type="button"
					class="flex size-4 cursor-pointer items-center justify-center"
					aria-label={m['Components.ImageGallerySmall.selectImage']({ index: index + 1 })}
					aria-pressed={index === activeIndex}
					onclick={() => api?.scrollTo(index)}
				>
					<span
						class={cn(
							'size-2 rounded-full transition-colors',
							index === activeIndex ? 'bg-white' : 'bg-white/50'
						)}
					></span>
				</button>
			{/each}
		</div>
	{/if}
</div>
