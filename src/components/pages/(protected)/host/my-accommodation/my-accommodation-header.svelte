<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';
	import {
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { MyAccommodationSummary } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let { accommodation }: { accommodation: MyAccommodationSummary } = $props();

	// SAFETY: Convex validates the untrusted route ID and checks ownership before returning status.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);
	const summary = useQuery(
		api.tables.accommodations.queries.fetchMyAccommodation.fetchMyAccommodation,
		() => ({ id: accommodationId })
	);
	const status = $derived(summary.data?.status ?? accommodation.status);
	const isPublished = $derived(status === 'published');
</script>

<header class="flex flex-col gap-5">
	<a
		href={PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS}
		class="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
	>
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['MyAccommodationPage.MyAccommodationHeader.back']()}
	</a>

	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex flex-col gap-2">
			<div class="flex flex-wrap items-center gap-3">
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{accommodation.name}</h1>
				<Badge variant={isPublished ? 'secondary' : 'outline'}>
					{isPublished
						? m['MyAccommodationPage.MyAccommodationHeader.published']()
						: m['MyAccommodationPage.MyAccommodationHeader.unpublished']()}
				</Badge>
			</div>

			<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
				<span class="icon-[lucide--map-pin] size-4" aria-hidden="true"></span>
				{accommodation.address.city}, {accommodation.address.country}
			</p>
		</div>

		<Button variant="outline" href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(accommodation._id)}>
			<span class="icon-[lucide--external-link]" data-icon="inline-start" aria-hidden="true"></span>
			{m['MyAccommodationPage.MyAccommodationHeader.view']()}
		</Button>
	</div>
</header>
