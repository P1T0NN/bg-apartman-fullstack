<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex flex-col gap-2">
	<h1 class="text-2xl font-semibold tracking-tight">
		{m['ClaimBookingPage.ClaimBookingHeader.title']()}
	</h1>

	<p class="max-w-prose text-sm leading-6 text-muted-foreground">
		{m['ClaimBookingPage.ClaimBookingHeader.description']()}
	</p>
</header>
