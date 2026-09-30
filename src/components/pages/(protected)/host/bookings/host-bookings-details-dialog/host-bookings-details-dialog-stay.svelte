<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	let { checkInDate, checkOutDate }: { checkInDate: string; checkOutDate: string } = $props();
</script>

<div class="min-w-0 rounded-2xl border p-3">
	<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{m['HostBookingsPage.HostBookingsDetailsDialogStay.stay']()}
	</dt>
	<dd class="mt-1.5 flex flex-col gap-3 text-sm">
		<span class="inline-flex flex-wrap items-center gap-1.5">
			<span class="icon-[lucide--log-in] size-4 text-muted-foreground" aria-hidden="true"></span>
			{m['HostBookingsPage.HostBookingsDetailsDialogStay.checkIn']()}:
			<span class="font-medium">{formatDate(Date.parse(checkInDate), getLocale())}</span>
		</span>
		<span class="inline-flex flex-wrap items-center gap-1.5">
			<span class="icon-[lucide--log-out] size-4 text-muted-foreground" aria-hidden="true"></span>
			{m['HostBookingsPage.HostBookingsDetailsDialogStay.checkOut']()}:
			<span class="font-medium">{formatDate(Date.parse(checkOutDate), getLocale())}</span>
		</span>
	</dd>
</div>
