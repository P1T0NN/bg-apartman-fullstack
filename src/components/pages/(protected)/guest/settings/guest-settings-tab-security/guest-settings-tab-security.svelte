<script lang="ts">
	// SVELTEKIT IMPORTS
	import { onMount } from 'svelte';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { authClient } from '@/features/auth/lib/authClient';
	import { runAuthAction } from '@/features/auth/lib/runAuthAction';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import GuestSettingsPasswordDialog from './guest-settings-password-dialog.svelte';
	import GuestSettingsSessionItem from './guest-settings-session-item.svelte';
	import GuestSettingsSessionsLoading from '../loading/guest-settings-sessions-loading.svelte';

	// TYPES
	import type { AuthSession } from '@/shared/features/auth/types/authTypes.js';

	let sessions = $state<AuthSession[] | null>(null);
	let currentToken = $state<string | null>(null);
	let loadFailed = $state(false);
	let revoking = $state<string | null>(null);

	const otherSessions = $derived(
		sessions?.filter((session) => session.token !== currentToken) ?? []
	);

	function toMillis(value: Date | string | number): number {
		return new Date(value).getTime();
	}

	async function loadSessions(): Promise<void> {
		loadFailed = false;
		const [list, current] = await Promise.all([authClient.listSessions(), authClient.getSession()]);

		if (list.error) {
			loadFailed = true;
			return;
		}

		sessions = (list.data ?? []).map((session) => ({
			id: session.id,
			token: session.token,
			createdAt: toMillis(session.createdAt),
			updatedAt: toMillis(session.updatedAt),
			expiresAt: toMillis(session.expiresAt),
			ipAddress: session.ipAddress,
			userAgent: session.userAgent
		}));
		currentToken = current.data?.session.token ?? null;
	}

	onMount(() => {
		void loadSessions();
	});

	async function revoke(session: AuthSession): Promise<void> {
		revoking = session.id;
		const revoked = await runAuthAction(
			() => authClient.revokeSession({ token: session.token }),
			m['GuestSettingsPage.GuestSettingsSessionItem.signedOut'](),
			m['ErrorMessages.unexpected']()
		);
		revoking = null;

		if (revoked) await loadSessions();
	}

	async function revokeOtherSessions(): Promise<void> {
		revoking = 'others';
		const revoked = await runAuthAction(
			() => authClient.revokeOtherSessions(),
			m['GuestSettingsPage.GuestSettingsTabSecurity.signedOutOthers'](),
			m['ErrorMessages.unexpected']()
		);
		revoking = null;

		if (revoked) await loadSessions();
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['GuestSettingsPage.GuestSettingsTabSecurity.title']()}</Card.Title>
		<Card.Description>
			{m['GuestSettingsPage.GuestSettingsTabSecurity.description']()}
		</Card.Description>
	</Card.Header>

	<Card.Content class="flex flex-col gap-6">
		<div
			class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
		>
			<div class="min-w-0">
				<h3 class="text-sm font-semibold">
					{m['GuestSettingsPage.GuestSettingsTabSecurity.passwordTitle']()}
				</h3>
				<p class="text-sm text-muted-foreground">
					{m['GuestSettingsPage.GuestSettingsTabSecurity.passwordDescription']()}
				</p>
			</div>

			<GuestSettingsPasswordDialog onChanged={loadSessions} />
		</div>

		<div class="flex flex-col gap-3">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
					<h3 class="text-sm font-semibold">
						{m['GuestSettingsPage.GuestSettingsTabSecurity.sessionsTitle']()}
					</h3>
					<p class="text-sm text-muted-foreground">
						{m['GuestSettingsPage.GuestSettingsTabSecurity.sessionsDescription']()}
					</p>
				</div>
				{#if otherSessions.length > 0}
					<Button
						variant="outline"
						size="sm"
						disabled={revoking !== null}
						onclick={() => void revokeOtherSessions()}
					>
						{#if revoking === 'others'}
							<Spinner data-icon="inline-start" />
						{/if}
						{m['GuestSettingsPage.GuestSettingsTabSecurity.signOutOthers']()}
					</Button>
				{/if}
			</div>

			{#if loadFailed}
				<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
			{:else if sessions === null}
				<GuestSettingsSessionsLoading />
			{:else}
				<ul class="flex flex-col gap-2">
					{#each sessions as session (session.id)}
						<li>
							<GuestSettingsSessionItem
								{session}
								isCurrent={session.token === currentToken}
								pending={revoking === session.id}
								disabled={revoking !== null}
								onSignOut={() => void revoke(session)}
							/>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
