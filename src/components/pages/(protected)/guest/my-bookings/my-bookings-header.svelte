<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { m } from '@/lib/paraglide/messages';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<header class="flex min-w-0 flex-col gap-2">
	<h1 class="text-3xl font-semibold tracking-tight">{m['MyBookingsPage.pageTitle']()}</h1>
	<p class="max-w-prose text-sm leading-6 text-muted-foreground">
		{m['MyBookingsPage.MyBookingsHeader.description']()}
	</p>
	{#if showTotal}
		{#if total != null}
			<p class="text-xs text-muted-foreground">
				{m['MyBookingsPage.MyBookingsHeader.bookingsFound']({ count: total })}
			</p>
		{:else}
			<Skeleton class="h-4 w-40" />
		{/if}
	{:else}
		<p class="text-xs text-muted-foreground">
			{m['MyBookingsPage.MyBookingsHeader.filteredLabel']()}
		</p>
	{/if}
</header>
