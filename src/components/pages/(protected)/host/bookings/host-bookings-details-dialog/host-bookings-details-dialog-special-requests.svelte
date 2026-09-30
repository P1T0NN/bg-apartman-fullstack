<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	let { requests }: { requests: string } = $props();
</script>

<div class="rounded-2xl border bg-muted/30 p-3">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{m['HostBookingsPage.HostBookingsDetailsDialogSpecialRequests.requests']()}
	</p>
	<p class="mt-1 text-sm break-words">{requests}</p>
</div>
