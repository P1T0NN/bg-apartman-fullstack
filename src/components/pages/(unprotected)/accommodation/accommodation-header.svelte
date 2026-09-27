<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import CopyValue from '@/components/ui/custom-components/copy-value/copy-value.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: PublicAccommodation } = $props();
</script>

<header class="flex flex-col gap-5 pb-6">
	<Link
		href={UNPROTECTED_PAGE_ENDPOINTS.SEARCH + page.url.search}
		class="flex min-h-11 w-fit items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
	>
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['AccommodationPage.AccommodationHeader.back']()}
	</Link>

	<div class="flex flex-wrap items-end justify-between gap-4">
		<div class="min-w-0">
			<p class="mb-2 text-sm text-muted-foreground">
				{m[`AccommodationPage.AccommodationHeader.${accommodation.spaceType}`]()}
			</p>

			<h1 class="max-w-4xl text-3xl font-semibold tracking-tight wrap-break-word sm:text-4xl">
				{accommodation.name}
			</h1>

			<a
				href="#location"
				class="mt-3 flex min-h-8 w-fit items-center gap-2 text-sm underline decoration-border underline-offset-4 hover:decoration-current"
			>
				<span class="icon-[lucide--map-pin] size-4 shrink-0" aria-hidden="true"></span>
				{accommodation.address.city}, {accommodation.address.country}
			</a>
		</div>
		
		<CopyValue
			label={m['AccommodationPage.AccommodationHeader.share']()}
			value={page.url.origin + page.url.pathname}
		/>
	</div>
</header>
