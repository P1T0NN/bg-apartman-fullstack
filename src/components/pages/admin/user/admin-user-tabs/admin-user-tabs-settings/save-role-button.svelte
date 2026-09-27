<script lang="ts">
	// AUTH
	import { authClient } from '@/features/auth/lib/authClient';

	// COMPONENTS
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	type Role = 'user' | 'admin';
	type Props = {
		userId: string;
		currentRole: Role;
		selectedRole: Role;
	};

	let { userId, currentRole, selectedRole }: Props = $props();
	let pendingAction = $state<'role' | null>(null);

	async function saveRole(event: MouseEvent): Promise<void> {
		event.preventDefault();
		if (selectedRole === currentRole || pendingAction !== null) return;

		pendingAction = 'role';
		try {
			await runAuthAction(
				() => authClient.admin.setRole({ userId, role: selectedRole }),
				m['AdminUserPage.SaveRoleButton.roleUpdated'](),
				m['ErrorMessages.unexpected']()
			);
		} finally {
			pendingAction = null;
		}
	}
</script>

<Button
	type="submit"
	variant="outline"
	size="sm"
	disabled={selectedRole === currentRole || pendingAction !== null}
	onclick={saveRole}
>
	{#if pendingAction === 'role'}<Spinner data-icon="inline-start" />{/if}
	{m['AdminUserPage.SaveRoleButton.saveRole']()}
</Button>
