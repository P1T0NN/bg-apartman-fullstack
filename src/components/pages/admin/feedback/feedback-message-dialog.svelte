<script lang="ts">
	// LIBRARIES
	import type { FunctionReturnType } from 'convex/server';

	// CONVEX
	import type { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { m } from '@/lib/paraglide/messages';

	type Feedback = FunctionReturnType<
		typeof api.tables.feedbacks.queries.fetchFeedbacksAdmin.fetchFeedbacksAdmin
	>['items'][number];

	let { feedback }: { feedback: Feedback } = $props();

	const headingId = $derived(`feedback-message-${feedback._id}`);
</script>

<NativeDialog aria-labelledby={headingId}>
	{#snippet trigger({ open })}
		<button
			type="button"
			onclick={open}
			class="group flex w-full min-w-0 cursor-pointer flex-col gap-1 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
		>
			<span class="truncate font-medium group-hover:underline">{feedback.title}</span>
			<span class="line-clamp-2 text-xs text-muted-foreground">{feedback.message}</span>
		</button>
	{/snippet}

	{#snippet children({ close })}
		<div class="flex flex-col gap-4 p-6">
			<h2 id={headingId} class="text-lg font-semibold">{feedback.title}</h2>
			<p class="text-sm whitespace-pre-wrap">{feedback.message}</p>
			<div class="flex justify-end">
				<Button variant="outline" size="sm" onclick={close}>
					{m['AdminFeedbackPage.FeedbackMessageDialog.close']()}
				</Button>
			</div>
		</div>
	{/snippet}
</NativeDialog>
