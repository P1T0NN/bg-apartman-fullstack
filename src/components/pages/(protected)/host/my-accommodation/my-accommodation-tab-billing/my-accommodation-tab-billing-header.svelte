<script lang="ts">
	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONSTANTS
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	let { id, accommodationId }: { id: string; accommodationId: string } = $props();
</script>

<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
	<div class="flex max-w-xl flex-col gap-2">
		<h2 {id} class="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
			{m['MyAccommodationPage.MyAccommodationTabBillingHeader.title']()}
		</h2>
		<p class="text-pretty text-muted-foreground">
			{m['MyAccommodationPage.MyAccommodationTabBillingHeader.description']()}
		</p>
	</div>

	<Button href={`${PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATION(accommodationId)}?tab=settings`}>
		{m['MyAccommodationPage.MyAccommodationTabBillingHeader.manageFees']()}
	</Button>
</div>
