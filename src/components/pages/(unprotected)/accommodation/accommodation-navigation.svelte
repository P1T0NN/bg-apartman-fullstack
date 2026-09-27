<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<nav
	aria-label={m['AccommodationPage.AccommodationNavigation.label']()}
	class="mt-3 flex gap-6 overflow-x-auto border-b text-sm font-medium"
>
	<a class="flex min-h-14 shrink-0 items-center hover:underline" href="#overview"
		>{m['AccommodationPage.AccommodationNavigation.overview']()}</a
	>
	<a class="flex min-h-14 shrink-0 items-center hover:underline" href="#amenities"
		>{m['AccommodationPage.AccommodationNavigation.amenities']()}</a
	>
	<a class="flex min-h-14 shrink-0 items-center hover:underline" href="#location"
		>{m['AccommodationPage.AccommodationNavigation.location']()}</a
	>
	<a class="flex min-h-14 shrink-0 items-center hover:underline" href="#rules"
		>{m['AccommodationPage.AccommodationNavigation.rules']()}</a
	>
</nav>
