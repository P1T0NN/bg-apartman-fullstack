<script lang="ts">
	// COMPONENTS
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { m } from '@/lib/paraglide/messages';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<div class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['MyBookingsPage.MyBookingsHeader.guestLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">
		{#if showTotal}
			{#if total != null}
				{m['MyBookingsPage.MyBookingsHeader.bookingsFound']({ count: total })}
			{:else}
				<span class="inline-flex items-center gap-1">
					{m['MyBookingsPage.MyBookingsHeader.bookingsLabel']()} - <Spinner />
					{m['MyBookingsPage.MyBookingsHeader.foundLabel']()}
				</span>
			{/if}
		{:else}
			{m['MyBookingsPage.MyBookingsHeader.filteredLabel']()}
		{/if}
	</h1>
	<p class="text-sm text-muted-foreground">{m['MyBookingsPage.MyBookingsHeader.description']()}</p>
</div>
