<script lang="ts">
	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';

	// CONVEX
	import type { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import FeedbackMessageDialog from './feedback-message-dialog.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import ResolveFeedbackDialog from './resolve-feedback-dialog.svelte';
	import { TableCell } from '@/components/ui/table';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { formatDateTime } from '@/shared/utils/date.js';

	type Feedback = FunctionReturnType<
		typeof api.tables.feedbacks.queries.fetchFeedbacksAdmin.fetchFeedbacksAdmin
	>['items'][number];

	let { feedback }: { feedback: Feedback } = $props();

	const categoryLabels = {
		booking: m['FeedbacksFeature.category.booking'](),
		payment: m['FeedbacksFeature.category.payment'](),
		account: m['FeedbacksFeature.category.account'](),
		accommodation: m['FeedbacksFeature.category.accommodation'](),
		other: m['FeedbacksFeature.category.other']()
	} satisfies Record<Feedback['category'], string>;
</script>

<TableCell>
	{#if feedback.userId}
		<a
			href={ADMIN_PAGE_ENDPOINTS.USER(feedback.userId)}
			class="group inline-flex max-w-full min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<NativeAvatar name={feedback.userName ?? feedback.userEmail ?? 'User'} size="sm" />
			<div class="min-w-0">
				<p class="truncate font-medium group-hover:underline">
					{feedback.userName ?? feedback.userEmail}
				</p>
				{#if feedback.userName && feedback.userEmail}
					<p class="truncate text-xs text-muted-foreground group-hover:underline">
						{feedback.userEmail}
					</p>
				{/if}
			</div>
		</a>
	{:else}
		<div class="flex min-w-0 items-center gap-3">
			<span
				class="icon-[lucide--mail] size-5 shrink-0 text-muted-foreground"
				aria-hidden="true"
			></span>
			<span class="truncate">
				{feedback.email ?? m['AdminFeedbackPage.AdminFeedbackTableItem.guest']()}
			</span>
		</div>
	{/if}
</TableCell>
<TableCell>
	<FeedbackMessageDialog {feedback} />
</TableCell>
<TableCell>
	<Badge variant="outline">{categoryLabels[feedback.category]}</Badge>
</TableCell>
<TableCell>
	<Badge variant={feedback.type === 'bug' ? 'destructive' : 'secondary'}>
		{feedback.type === 'bug'
			? m['FeedbacksFeature.type.bug']()
			: m['FeedbacksFeature.type.question']()}
	</Badge>
</TableCell>
<TableCell class="whitespace-nowrap text-muted-foreground">
	{formatDateTime(feedback._creationTime, getLocale())}
</TableCell>
<TableCell>
	{#if feedback.status === 'resolved'}
		<Badge variant="outline" class="border-success/30 bg-success/10 text-success">
			{m['AdminFeedbackPage.AdminFeedbackTableItem.resolved']()}
		</Badge>
	{:else}
		<ResolveFeedbackDialog feedbackId={feedback._id} />
	{/if}
</TableCell>
