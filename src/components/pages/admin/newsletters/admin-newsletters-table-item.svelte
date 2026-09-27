<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { TableCell } from '@/components/ui/table';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel';

	type Newsletter = Doc<'newsletters'>;

	let { newsletter }: { newsletter: Newsletter } = $props();
</script>

<TableCell>
	<div class="flex min-w-0 items-center gap-3">
		<span class="icon-[lucide--mail] size-5 shrink-0 text-muted-foreground" aria-hidden="true"
		></span>
		<span class="truncate font-medium">{newsletter.email}</span>
	</div>
</TableCell>
<TableCell>
	<Badge variant={newsletter.status === 'subscribed' ? 'default' : 'secondary'}>
		{newsletter.status === 'subscribed'
			? m['AdminNewslettersPage.AdminNewslettersTableItem.subscribed']()
			: m['AdminNewslettersPage.AdminNewslettersTableItem.unsubscribed']()}
	</Badge>
</TableCell>
<TableCell class="whitespace-nowrap text-muted-foreground">
	{formatDateTime(newsletter.subscribedAt, getLocale())}
</TableCell>
<TableCell class="whitespace-nowrap text-muted-foreground">
	{#if newsletter.unsubscribedAt}
		{formatDateTime(newsletter.unsubscribedAt, getLocale())}
	{:else}
		<span aria-hidden="true">—</span>
	{/if}
</TableCell>
