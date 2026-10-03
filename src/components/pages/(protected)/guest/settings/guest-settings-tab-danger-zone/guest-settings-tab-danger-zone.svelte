<script lang="ts">
	// AUTH
	import { authClient } from '@/features/auth/lib/authClient';
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import ConfirmDialogActions from '@/components/ui/custom-components/confirm-dialog-actions/confirm-dialog-actions.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// TYPES
	import type { AuthUserSummary } from '@/shared/features/auth/types/authTypes.js';

	let { user }: { user: AuthUserSummary } = $props();

	let confirmation = $state('');
	let pending = $state(false);

	const isConfirmed = $derived(confirmation.trim().toLowerCase() === user.email.toLowerCase());

	async function requestDeletion(close: () => void): Promise<void> {
		if (!isConfirmed) return;

		pending = true;
		const sent = await runAuthAction(
			() => authClient.deleteUser({ callbackURL: UNPROTECTED_PAGE_ENDPOINTS.ROOT }),
			m['GuestSettingsPage.GuestSettingsTabDangerZone.sent'](),
			m['ErrorMessages.unexpected']()
		);
		pending = false;

		if (sent) {
			confirmation = '';
			close();
		}
	}
</script>

<Card.Root class="border border-destructive/40">
	<Card.Header>
		<Card.Title class="flex items-center gap-2 text-destructive">
			<span class="icon-[lucide--triangle-alert] size-4" aria-hidden="true"></span>
			{m['GuestSettingsPage.GuestSettingsTabDangerZone.title']()}
		</Card.Title>
		<Card.Description>
			{m['GuestSettingsPage.GuestSettingsTabDangerZone.description']()}
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<NativeDialog aria-labelledby="guest-delete-account-title">
			{#snippet trigger({ id })}
				<Button variant="destructive" size="sm" commandfor={id} command="show-modal">
					{m['GuestSettingsPage.GuestSettingsTabDangerZone.deleteAccount']()}
				</Button>
			{/snippet}

			{#snippet children({ id, close })}
				<form
					class="flex flex-col gap-5 p-6"
					onsubmit={(event) => {
						event.preventDefault();
						void requestDeletion(close);
					}}
				>
					<div class="flex flex-col gap-1.5">
						<h2 id="guest-delete-account-title" class="text-lg font-semibold">
							{m['GuestSettingsPage.GuestSettingsTabDangerZone.dialogTitle']()}
						</h2>
						<p class="text-sm text-muted-foreground">
							{m['GuestSettingsPage.GuestSettingsTabDangerZone.dialogDescription']()}
						</p>
					</div>

					<Field.Field>
						<Field.Label for="delete-account-confirmation">
							{m['GuestSettingsPage.GuestSettingsTabDangerZone.typeToConfirm']({
								email: user.email
							})}
						</Field.Label>
						<Input
							id="delete-account-confirmation"
							bind:value={confirmation}
							autocomplete="off"
							spellcheck="false"
							disabled={pending}
						/>
					</Field.Field>

					<ConfirmDialogActions
						{pending}
						cancelLabel={m['GuestSettingsPage.GuestSettingsTabDangerZone.keepAccount']()}
						confirmLabel={m['GuestSettingsPage.GuestSettingsTabDangerZone.deleteAccount']()}
						confirmType="submit"
						confirmDisabled={!isConfirmed}
						cancelCommandFor={id}
					/>
				</form>
			{/snippet}
		</NativeDialog>
	</Card.Content>
</Card.Root>
