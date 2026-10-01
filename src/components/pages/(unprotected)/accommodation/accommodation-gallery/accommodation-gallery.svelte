<script lang="ts">
	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import AccommodationGalleryDialog from './accommodation-gallery-dialog.svelte';
	import AccommodationGalleryDialogTrigger from './accommodation-gallery-dialog-trigger.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let { images, name }: { images: string[]; name: string } = $props();
</script>

<section aria-label={m['AccommodationPage.AccommodationGallery.photos']()}>
	{#if images.length}
		<NativeDialog aria-labelledby="accommodation-photos-title" class="max-w-3xl p-4 sm:p-6">
			{#snippet trigger({ id })}
				<AccommodationGalleryDialogTrigger {images} {name} dialogId={id} />
			{/snippet}

			{#snippet children({ id })}
				<AccommodationGalleryDialog {images} {name} dialogId={id} />
			{/snippet}
		</NativeDialog>
	{:else}
		<div class="flex h-72 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
			{m['AccommodationPage.AccommodationGallery.noPhotos']()}
		</div>
	{/if}
</section>
