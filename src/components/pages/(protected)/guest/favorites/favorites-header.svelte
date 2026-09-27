<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<div class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['FavoritesPage.FavoritesHeader.guestLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">{m['FavoritesPage.pageTitle']()}</h1>
	<p class="text-sm text-muted-foreground">{m['FavoritesPage.FavoritesHeader.description']()}</p>
</div>
