<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatDateTime, formatRelativeTime } from '@/shared/utils/date.js';

	// TYPES
	import type { GuestSession } from './guestSettingsTypes.js';

	let {
		session,
		isCurrent = false,
		pending = false,
		disabled = false,
		onSignOut
	}: {
		session: GuestSession;
		isCurrent?: boolean;
		pending?: boolean;
		disabled?: boolean;
		onSignOut: () => void;
	} = $props();
</script>

<article
	class="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
>
	<div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
		{#if isCurrent}
			<Badge variant="outline" class="border-success/30 bg-success/10 text-success">
				{m['GuestSettingsPage.GuestSettingsSessionItem.current']()}
			</Badge>
		{/if}

		<span class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
			<span class="icon-[lucide--globe-2] size-3.5 shrink-0" aria-hidden="true"></span>
			{session.ipAddress ?? m['GuestSettingsPage.GuestSettingsSessionItem.unknownIp']()}
		</span>

		<span
			class="inline-flex min-w-0 basis-full items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto sm:basis-auto"
			title={session.userAgent ?? m['GuestSettingsPage.GuestSettingsSessionItem.unknownAgent']()}
		>
			<span class="icon-[lucide--monitor] size-3.5 shrink-0" aria-hidden="true"></span>
			<span class="truncate font-mono">
				{session.userAgent ?? m['GuestSettingsPage.GuestSettingsSessionItem.unknownAgent']()}
			</span>
		</span>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2">
		<dl class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
			<div
				class="inline-flex items-center gap-1 whitespace-nowrap after:ml-1 after:text-border after:content-['-'] last:after:hidden"
			>
				<dt class="text-muted-foreground">
					{m['GuestSettingsPage.GuestSettingsSessionItem.started']()}
				</dt>
				<dd class="font-medium">
					<time
						datetime={new Date(session.createdAt).toISOString()}
						title={formatDateTime(session.createdAt, getLocale())}
					>
						{formatRelativeTime(session.createdAt, getLocale())}
					</time>
				</dd>
			</div>
			<div
				class="inline-flex items-center gap-1 whitespace-nowrap after:ml-1 after:text-border after:content-['-'] last:after:hidden"
			>
				<dt class="text-muted-foreground">
					{m['GuestSettingsPage.GuestSettingsSessionItem.lastActive']()}
				</dt>
				<dd class="font-medium">
					<time
						datetime={new Date(session.updatedAt).toISOString()}
						title={formatDateTime(session.updatedAt, getLocale())}
					>
						{formatRelativeTime(session.updatedAt, getLocale())}
					</time>
				</dd>
			</div>
			<div class="inline-flex items-center gap-1 whitespace-nowrap">
				<dt class="text-muted-foreground">
					{m['GuestSettingsPage.GuestSettingsSessionItem.expires']()}
				</dt>
				<dd class="font-medium">
					<time
						datetime={new Date(session.expiresAt).toISOString()}
						title={formatDateTime(session.expiresAt, getLocale())}
					>
						{formatRelativeTime(session.expiresAt, getLocale())}
					</time>
				</dd>
			</div>
		</dl>

		{#if !isCurrent}
			<Button
				variant="outline"
				size="sm"
				disabled={disabled || pending}
				onclick={onSignOut}
				aria-label={m['GuestSettingsPage.GuestSettingsSessionItem.signOutLabel']()}
			>
				{#if pending}
					<Spinner data-icon="inline-start" />
				{/if}
				{m['GuestSettingsPage.GuestSettingsSessionItem.signOut']()}
			</Button>
		{/if}
	</div>
</article>
