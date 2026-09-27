<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONTEXT
	import { getFavoritesContext } from '@/features/favorites/context/favoritesContext.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	// LUCIDE ICONS
	import Heart from '@lucide/svelte/icons/heart';

	let {
		accommodationId,
		name,
		class: className
	}: {
		accommodationId: Id<'accommodations'>;
		name: string;
		class?: string;
	} = $props();

	const favorites = getFavoritesContext();

	const favorite = $derived(favorites.isFavorite(accommodationId));
	const pending = $derived(favorites.isPending(accommodationId));
</script>

<button
	type="button"
	class={cn(
		'flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 shadow-sm backdrop-blur transition-colors hover:bg-background',
		className
	)}
	aria-pressed={favorite}
	aria-label={favorite
		? m['FavoritesFeature.FavoriteButton.remove']({ name })
		: m['FavoritesFeature.FavoriteButton.save']({ name })}
	disabled={pending}
	onclick={() => void favorites.toggle(accommodationId)}
>
	<!-- Lucide is imported directly instead of iconify because the saved state fills the
		heart with `fill-current`, and iconify/tailwind icons render via a CSS mask that
		cannot be filled. -->
	<Heart
		class={cn('size-5', favorite ? 'fill-current text-primary' : 'text-foreground')}
		aria-hidden="true"
	/>
</button>
