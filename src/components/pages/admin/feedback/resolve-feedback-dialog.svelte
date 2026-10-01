<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	let { feedbackId }: { feedbackId: Id<'feedbacks'> } = $props();

	const updateFeedbackStatus = useMutation(
		api.tables.feedbacks.mutations.updateFeedbackStatus.updateFeedbackStatus
	);
	let pending = $state(false);

	async function resolve(close: () => void): Promise<void> {
		pending = true;
		try {
			await updateFeedbackStatus({ id: feedbackId, status: 'resolved' });
			toastMessage({
				type: 'success',
				message: m['AdminFeedbackPage.ResolveFeedbackDialog.resolved']()
			});
			close();
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<NativeDialog aria-labelledby={`resolve-feedback-${feedbackId}`}>
	{#snippet trigger({ id })}
		<Button variant="outline" size="sm" commandfor={id} command="show-modal">
			{m['AdminFeedbackPage.ResolveFeedbackDialog.resolve']()}
		</Button>
	{/snippet}

	{#snippet children({ id, close })}
		<form
			class="flex flex-col gap-5 p-6"
			onsubmit={(event) => {
				event.preventDefault();
				void resolve(close);
			}}
		>
			<div class="flex flex-col gap-1.5">
				<h2 id={`resolve-feedback-${feedbackId}`} class="text-lg font-semibold">
					{m['AdminFeedbackPage.ResolveFeedbackDialog.title']()}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['AdminFeedbackPage.ResolveFeedbackDialog.description']()}
				</p>
			</div>

			<div class="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={pending}
					commandfor={id}
					command="close"
				>
					{m['AdminFeedbackPage.ResolveFeedbackDialog.cancel']()}
				</Button>
				<Button type="submit" size="sm" disabled={pending}>
					{#if pending}
						<Spinner data-icon="inline-start" />
					{/if}
					{m['AdminFeedbackPage.ResolveFeedbackDialog.resolve']()}
				</Button>
			</div>
		</form>
	{/snippet}
</NativeDialog>
