<script lang="ts">
	// SVELTEKIT IMPORTS
	import { invalidateAll } from '$app/navigation';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { authClient } from '@/features/auth/lib/authClient';
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { AuthUserSummary } from '@/shared/features/auth/types/authTypes.js';

	let { user }: { user: AuthUserSummary } = $props();

	// The form draft starts from the loaded user; saves are explicit and resync it.
	// svelte-ignore state_referenced_locally
	let name = $state(user.name);
	let saving = $state(false);

	const savedName = $derived(user.name);
	const trimmedName = $derived(name.trim());
	const isDirty = $derived(trimmedName.length > 0 && trimmedName !== savedName);

	async function save(): Promise<void> {
		if (!isDirty) return;

		saving = true;
		const updated = await runAuthAction(
			() => authClient.updateUser({ name: trimmedName }),
			m['GuestSettingsPage.GuestSettingsTabProfile.updated'](),
			m['ErrorMessages.unexpected']()
		);
		saving = false;

		if (updated) {
			await invalidateAll();
			name = user.name;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['GuestSettingsPage.GuestSettingsTabProfile.title']()}</Card.Title>
		<Card.Description>
			{m['GuestSettingsPage.GuestSettingsTabProfile.description']()}
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<form
			class="flex flex-col gap-5"
			onsubmit={(event) => {
				event.preventDefault();
				void save();
			}}
		>
			<Field.Field>
				<Field.Label for="display-name">
					{m['GuestSettingsPage.GuestSettingsTabProfile.displayName']()}
				</Field.Label>
				<Input
					id="display-name"
					bind:value={name}
					autocomplete="name"
					required
					maxlength={100}
					disabled={saving}
				/>
			</Field.Field>

			<div class="flex flex-col gap-1.5">
				<p class="text-sm font-medium">
					{m['GuestSettingsPage.GuestSettingsTabProfile.email']()}
				</p>
				<div class="flex min-w-0 items-center gap-2">
					<span class="min-w-0 truncate text-sm text-muted-foreground">{user.email}</span>
					<Badge
						variant="outline"
						class={cn(
							'gap-1',
							user.emailVerified
								? 'border-success/30 bg-success/10 text-success'
								: 'border-warning/30 bg-warning/10 text-warning'
						)}
					>
						<span
							class={user.emailVerified
								? 'icon-[lucide--badge-check] size-3'
								: 'icon-[lucide--triangle-alert] size-3'}
							aria-hidden="true"
						></span>
						{user.emailVerified
							? m['GuestSettingsPage.GuestSettingsTabProfile.verified']()
							: m['GuestSettingsPage.GuestSettingsTabProfile.unverified']()}
					</Badge>
				</div>
				<p class="text-sm text-muted-foreground">
					{m['GuestSettingsPage.GuestSettingsTabProfile.emailHint']()}
				</p>
			</div>

			<div class="flex justify-end">
				<Button type="submit" size="sm" disabled={!isDirty || saving}>
					{#if saving}
						<Spinner data-icon="inline-start" />
					{/if}
					{m['GuestSettingsPage.GuestSettingsTabProfile.save']()}
				</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
