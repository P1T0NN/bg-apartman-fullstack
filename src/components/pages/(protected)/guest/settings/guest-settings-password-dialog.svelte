<script lang="ts">
	// AUTH
	import { authClient } from '@/features/auth/lib/authClient';
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import PasswordInput from '@/components/ui/custom-components/password-input/password-input.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';

	let { onChanged }: { onChanged?: () => void | Promise<void> } = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let revokeOthers = $state(true);
	let submitting = $state(false);
	let localError = $state<'SHORT' | 'MISMATCH' | null>(null);

	function reset(): void {
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		revokeOthers = true;
		localError = null;
	}

	async function changePassword(close: () => void): Promise<void> {
		localError = null;

		if (newPassword.length < 8) {
			localError = 'SHORT';
			return;
		}

		if (newPassword !== confirmPassword) {
			localError = 'MISMATCH';
			return;
		}

		submitting = true;
		const updated = await runAuthAction(
			() =>
				authClient.changePassword({
					currentPassword,
					newPassword,
					revokeOtherSessions: revokeOthers
				}),
			m['GuestSettingsPage.GuestSettingsPasswordDialog.updated'](),
			m['ErrorMessages.unexpected']()
		);
		submitting = false;

		if (updated) {
			reset();
			close();
			await onChanged?.();
		}
	}
</script>

<NativeDialog aria-labelledby="guest-change-password-title">
	{#snippet trigger({ open })}
		<Button
			variant="outline"
			size="sm"
			onclick={() => {
				reset();
				open();
			}}
		>
			{m['GuestSettingsPage.GuestSettingsSecurityCard.changePassword']()}
		</Button>
	{/snippet}

	{#snippet children({ close })}
		<form
			class="flex flex-col gap-5 p-6"
			onsubmit={(event) => {
				event.preventDefault();
				void changePassword(close);
			}}
		>
			<div class="flex flex-col gap-1.5">
				<h2 id="guest-change-password-title" class="text-lg font-semibold">
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.title']()}
				</h2>
				<p class="text-sm text-muted-foreground">
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.description']()}
				</p>
			</div>

			<Field.Field>
				<Field.Label for="current-password">
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.current']()}
				</Field.Label>
				<PasswordInput
					id="current-password"
					bind:value={currentPassword}
					autocomplete="current-password"
					required
					disabled={submitting}
				/>
			</Field.Field>

			<Field.Field>
				<Field.Label for="new-password">
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.next']()}
				</Field.Label>
				<PasswordInput
					id="new-password"
					bind:value={newPassword}
					autocomplete="new-password"
					required
					disabled={submitting}
				/>
				<Field.Description>
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.requirements']()}
				</Field.Description>
			</Field.Field>

			<Field.Field>
				<Field.Label for="confirm-password">
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.confirm']()}
				</Field.Label>
				<PasswordInput
					id="confirm-password"
					bind:value={confirmPassword}
					autocomplete="new-password"
					required
					disabled={submitting}
					aria-invalid={localError === 'MISMATCH'}
				/>
				{#if localError}
					<Field.Error>
						{localError === 'MISMATCH'
							? m['GuestSettingsPage.GuestSettingsPasswordDialog.mismatch']()
							: m['GuestSettingsPage.GuestSettingsPasswordDialog.requirements']()}
					</Field.Error>
				{/if}
			</Field.Field>

			<Field.Field>
				<Field.Label for="revoke-others" class="items-start">
					<Checkbox
						id="revoke-others"
						checked={revokeOthers}
						onCheckedChange={(checked) => (revokeOthers = checked === true)}
						disabled={submitting}
						class="mt-0.5 size-5"
					/>
					<span class="flex min-w-0 flex-col gap-0.5">
						<span>{m['GuestSettingsPage.GuestSettingsPasswordDialog.revokeOthers']()}</span>
						<Field.Description>
							{m['GuestSettingsPage.GuestSettingsPasswordDialog.revokeOthersHint']()}
						</Field.Description>
					</span>
				</Field.Label>
			</Field.Field>

			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" size="sm" disabled={submitting} onclick={close}>
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.cancel']()}
				</Button>
				<Button type="submit" size="sm" disabled={submitting}>
					{#if submitting}<Spinner data-icon="inline-start" />{/if}
					{m['GuestSettingsPage.GuestSettingsPasswordDialog.submit']()}
				</Button>
			</div>
		</form>
	{/snippet}
</NativeDialog>
