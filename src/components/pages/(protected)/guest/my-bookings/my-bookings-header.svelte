<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex min-w-0 flex-col gap-2">
	<h1 class="text-3xl font-semibold tracking-tight">{m['MyBookingsPage.pageTitle']()}</h1>
	<p class="max-w-prose text-sm leading-6 text-muted-foreground">
		{m['MyBookingsPage.MyBookingsHeader.description']()}
	</p>
</header>
