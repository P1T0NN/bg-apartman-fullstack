<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import Link from '@/components/ui/custom-components/link/link.svelte';
</script>

<header class="pt-4 pb-8 sm:pb-10">
	<Link
		href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(page.params.id ?? '') + page.url.search}
		class="mb-6 flex min-h-11 w-fit items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4"
	>
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
		{m['BookingPage.BookingHeader.back']()}
	</Link>

	<div class="mb-3 flex flex-wrap items-center gap-3">
		<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
			{m['BookingPage.BookingHeader.title']()}
		</h1>
		<Badge variant="secondary">{m['BookingPage.BookingHeader.preview']()}</Badge>
	</div>

	<p class="max-w-prose text-sm leading-6 text-muted-foreground">
		{m['BookingPage.BookingHeader.description']()}
	</p>
</header>
