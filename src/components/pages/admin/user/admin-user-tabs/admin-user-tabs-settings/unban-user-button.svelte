<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	type PendingAction = 'unban' | null;

	let { userId }: { userId: string } = $props();

	let pendingAction = $state<PendingAction>(null);

	async function unbanUser(): Promise<void> {
		pendingAction = 'unban';

		try {
			await runAuthAction(
				() => authClient.admin.unbanUser({ userId }),
				m['AdminUserPage.UnbanUserButton.userUnbanned'](),
				m['ErrorMessages.unexpected']()
			);
		} finally {
			pendingAction = null;
		}
	}
</script>

<Button variant="outline" size="sm" disabled={pendingAction !== null} onclick={unbanUser}>
	{#if pendingAction === 'unban'}<Spinner data-icon="inline-start" />{/if}
	{m['AdminUserPage.UnbanUserButton.unbanUser']()}
</Button>
