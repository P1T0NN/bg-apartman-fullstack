<script lang="ts">
	// SVELTEKIT IMPORTS
	import { beforeNavigate } from '$app/navigation';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Drawer from '@/components/ui/drawer/index.js';
	import { buttonVariants } from '@/components/ui/button/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';

	// HOOKS
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		id,
		trigger,
		triggerLabel,
		triggerClass,
		header,
		children
	}: {
		id: string;
		trigger: Snippet;
		triggerLabel: string;
		triggerClass?: string;
		header?: Snippet;
		children: Snippet<[close: () => void]>;
	} = $props();

	const isCompact = new IsMobile(1024);
	let open = $state(false);

	function close(): void {
		open = false;
		document.getElementById(id)?.hidePopover();
	}

	beforeNavigate(close);
</script>

{#if isCompact.current}
	<Drawer.Root bind:open direction="right" shouldScaleBackground={false} autoFocus>
		<Drawer.Trigger
			aria-label={triggerLabel}
			class="inline-flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
		>
			{@render trigger()}
		</Drawer.Trigger>

		<Drawer.Content
			aria-describedby={undefined}
			class="h-dvh p-0 before:inset-0 before:rounded-none data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-none"
		>
			<Drawer.Header class="flex-row items-center justify-between gap-3 border-b">
				{#if header}
					<Drawer.Title class="sr-only">{m['Components.Header.navigation']()}</Drawer.Title>
					{@render header()}
				{:else}
					<Drawer.Title>{m['Components.Header.navigation']()}</Drawer.Title>
				{/if}

				<Drawer.Close
					class={buttonVariants({ variant: 'ghost', size: 'icon' })}
					aria-label={m['Components.Header.closeMenu']()}
				>
					<span class="icon-[lucide--x]" aria-hidden="true"></span>
				</Drawer.Close>
			</Drawer.Header>
			<div
				class="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] [&_a]:min-h-11 [&_button]:min-h-11"
			>
				{@render children(close)}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<NativePopover {id} {trigger} {triggerLabel} {triggerClass} align="end" class="w-56">
		{@render children(close)}
	</NativePopover>
{/if}
