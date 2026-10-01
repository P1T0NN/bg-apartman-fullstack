<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold tracking-tight">
			{m['MyReviewsPage.MyReviewsHeader.title']()}
		</h1>
		<p class="max-w-prose text-sm leading-6 text-muted-foreground">
			{m['MyReviewsPage.MyReviewsHeader.description']()}
		</p>
	</div>
	<Button href={PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS} variant="outline" class="min-h-11 w-fit">
		{m['MyReviewsPage.MyReviewsHeader.reviewStay']()}
	</Button>
</header>
