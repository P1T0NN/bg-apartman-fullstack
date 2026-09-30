<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import CopyValue from '@/components/ui/custom-components/copy-value/copy-value.svelte';

	let { email, phone }: { email: string; phone: string } = $props();
</script>

<div class="flex min-w-0 flex-col gap-2 rounded-2xl border p-3 sm:col-span-2">
	<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{m['HostBookingsPage.HostBookingsDetailsDialogGuestInfo.contact']()}
	</dt>
	<dd class="min-w-0">
		<CopyValue
			label={m['HostBookingsPage.HostBookingsDetailsDialogGuestInfo.email']()}
			value={email}
		/>
	</dd>
	<dd>
		<CopyValue
			label={m['HostBookingsPage.HostBookingsDetailsDialogGuestInfo.phone']()}
			value={phone}
		/>
	</dd>
</div>
