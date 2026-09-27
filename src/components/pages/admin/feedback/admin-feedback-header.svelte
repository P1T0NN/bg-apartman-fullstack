<script lang="ts">
	// COMPONENTS
	import { m } from '@/lib/paraglide/messages';

	let { total, showTotal = true }: { total?: number | null; showTotal?: boolean } = $props();
</script>

<div class="flex flex-col gap-1">
	<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
		{m['AdminFeedbackPage.AdminFeedbackHeader.adminLabel']()}
	</p>
	<h1 class="text-2xl font-semibold tracking-tight">
		{#if showTotal && total != null}
			{m['AdminFeedbackPage.AdminFeedbackHeader.itemsFound']({ count: total })}
		{:else if showTotal}
			{m['AdminFeedbackPage.AdminFeedbackHeader.itemsLabel']()}
		{:else}
			{m['AdminFeedbackPage.AdminFeedbackHeader.filteredLabel']()}
		{/if}
	</h1>
	<p class="text-sm text-muted-foreground">
		{m['AdminFeedbackPage.AdminFeedbackHeader.description']()}
	</p>
</div>
