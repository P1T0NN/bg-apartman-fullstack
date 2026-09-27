<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	
	// COMPONENTS
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<div class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['MyAccommodationsPage.MyAccommodationsHeader.hostLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">
		{#if showTotal}
			{#if total != null}
				{m['MyAccommodationsPage.MyAccommodationsHeader.accommodationsFound']({ count: total })}
			{:else}
				<span class="inline-flex items-center gap-1">
					{m['MyAccommodationsPage.MyAccommodationsHeader.accommodationsLabel']()} - <Spinner />
					{m['MyAccommodationsPage.MyAccommodationsHeader.foundLabel']()}
				</span>
			{/if}
		{:else}
			{m['MyAccommodationsPage.MyAccommodationsHeader.filteredLabel']()}
		{/if}
	</h1>
	<p class="text-sm text-muted-foreground">
		{m['MyAccommodationsPage.MyAccommodationsHeader.description']()}
	</p>
</div>
