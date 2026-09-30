<script lang="ts">
	// COMPONENTS
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { GuestSettingsUser } from './guestSettingsTypes.js';

	let { user }: { user: GuestSettingsUser } = $props();
</script>

<header class="flex items-center gap-4">
	<NativeAvatar name={user.name} image={user.image} size="lg" />
	<div class="flex min-w-0 flex-col gap-1">
		<h1 class="text-3xl font-semibold tracking-tight">{m['GuestSettingsPage.pageTitle']()}</h1>
		<p class="max-w-prose text-sm leading-6 text-muted-foreground">
			{m['GuestSettingsPage.GuestSettingsHeader.description']()}
		</p>
	</div>
</header>
