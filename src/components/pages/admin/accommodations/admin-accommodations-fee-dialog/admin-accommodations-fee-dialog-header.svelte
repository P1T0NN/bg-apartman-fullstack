<script lang="ts">
	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	let { id, name }: { id: string; name: string } = $props();
</script>

<div class="flex flex-col gap-1">
	<h2 {id} class="text-lg font-semibold">
		{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogHeader.title']({ name })}
	</h2>
	<p class="text-sm text-muted-foreground">
		{m['AdminAccommodationsPage.AdminAccommodationsFeeDialogHeader.hint']()}
	</p>
</div>
