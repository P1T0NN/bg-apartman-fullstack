<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<nav
	aria-label={m['AccommodationPage.AccommodationNavigation.label']()}
	class="mt-3 flex gap-2 overflow-x-auto border-b pb-3"
>
	<Button variant="outline" href="#overview">
		{m['AccommodationPage.AccommodationNavigation.overview']()}
	</Button>
	<Button variant="outline" href="#amenities">
		{m['AccommodationPage.AccommodationNavigation.amenities']()}
	</Button>
	<Button variant="outline" href="#reviews">
		{m['AccommodationPage.AccommodationNavigation.reviews']()}
	</Button>
	<Button variant="outline" href="#location">
		{m['AccommodationPage.AccommodationNavigation.location']()}
	</Button>
	<Button variant="outline" href="#rules">
		{m['AccommodationPage.AccommodationNavigation.rules']()}
	</Button>
</nav>
