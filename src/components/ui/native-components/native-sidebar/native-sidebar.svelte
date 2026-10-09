<script lang="ts">
	// LIBRARIES
	import * as Sheet from '@/components/ui/sheet/index.js';
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';

	// COMPONENTS
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';

	type SidebarSide = 'left' | 'right';

	let {
		children,
		sidebarHeader,
		sidebarFooter,
		class: className,
		label = m['Components.NativeSidebar.label'](),
		side = 'left',
		openMobile = $bindable(false)
	}: {
		children: Snippet;
		sidebarHeader?: Snippet;
		sidebarFooter?: Snippet;
		class?: string;
		label?: string;
		side?: SidebarSide;
		openMobile?: boolean;
	} = $props();

	const isMobile = new IsMobile();
</script>

{#if isMobile.current}
	<Sheet.Root bind:open={openMobile}>
		<Sheet.Content
			{side}
			class="inset-0 size-full max-w-none border-0 bg-sidebar p-0 text-sidebar-foreground"
		>
			<Sheet.Header class="sr-only">
				<Sheet.Title>{label}</Sheet.Title>
				<Sheet.Description>{m['Components.NativeSidebar.mobileNavigation']()}</Sheet.Description>
			</Sheet.Header>

			<div class="flex min-h-0 flex-1 flex-col [&_a]:py-2.5 [&_a]:text-sm [&_a_svg]:size-[18px]">
				{#if sidebarHeader}
					<header class="flex shrink-0 items-center gap-2 p-3 pr-14">
						<Logo showText={false} imageClass="size-7" />
						<div class="min-w-0 overflow-hidden">{@render sidebarHeader()}</div>
					</header>
				{/if}

				<div class="min-h-0 flex-1 overflow-auto">
					{@render children()}
				</div>

				{#if sidebarFooter}
					<div class="mt-auto shrink-0 border-t p-3">
						{@render sidebarFooter()}
					</div>
				{/if}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<aside
		aria-label={label}
		data-side={side}
		class={cn('pointer-events-auto sticky top-0 z-10 hidden h-screen shrink-0 md:block', className)}
	>
		<div
			data-native-sidebar-panel
			class={cn(
				'absolute inset-y-0 flex h-screen flex-col overflow-hidden bg-sidebar text-sidebar-foreground',
				side === 'left' ? 'start-0 border-e' : 'end-0 border-s'
			)}
		>
			{#if sidebarHeader}
				<header
					data-native-sidebar-header
					class="flex min-h-14 shrink-0 items-center gap-2 overflow-hidden px-3 py-2"
				>
					<Logo showText={false} imageClass="size-7" />
					<div data-native-sidebar-header-label class="min-w-0 overflow-hidden">
						{@render sidebarHeader()}
					</div>
				</header>
			{/if}

			<div data-native-sidebar-body class="min-h-0 flex-1 overflow-auto">
				{@render children()}
			</div>

			{#if sidebarFooter}
				<div data-native-sidebar-footer class="mt-auto shrink-0 border-t p-3">
					{@render sidebarFooter()}
				</div>
			{/if}
		</div>
	</aside>
{/if}

<style>
	aside {
		--native-sidebar-width: 16rem;
		--native-sidebar-width-collapsed: 3.5rem;
		inline-size: var(--native-sidebar-width-collapsed);
		block-size: 100vh;
		transition: inline-size 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	[data-native-sidebar-panel] {
		inline-size: var(--native-sidebar-width);
		clip-path: inset(0 calc(100% - var(--native-sidebar-width-collapsed)) 0 0);
		transition: clip-path 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	aside[data-side='right'] > [data-native-sidebar-panel] {
		clip-path: inset(0 0 0 calc(100% - var(--native-sidebar-width-collapsed)));
	}

	aside:is(:hover, :focus-within) > [data-native-sidebar-panel] {
		clip-path: inset(0);
	}

	aside:has(:global([aria-busy='true'])) > [data-native-sidebar-panel],
	aside:has(:global([popover]:popover-open)) > [data-native-sidebar-panel] {
		clip-path: inset(0);
	}

	aside:is(:hover, :focus-within) {
		inline-size: var(--native-sidebar-width);
	}

	aside:has(:global([aria-busy='true'])),
	aside:has(:global([popover]:popover-open)) {
		inline-size: var(--native-sidebar-width);
	}

	aside [data-native-sidebar-header-label],
	aside :global([data-native-sidebar-section-title]),
	aside :global([data-native-sidebar-link] > span:not([aria-hidden='true'])) {
		opacity: 0;
		transition: opacity 120ms ease-out;
	}

	[data-native-sidebar-footer] {
		transform: translateX(-0.5rem);
	}

	[data-native-sidebar-body] {
		transform: translateX(-0.3125rem);
	}

	[data-native-sidebar-header] {
		transform: translateX(0.125rem);
	}

	aside[data-side='right'] [data-native-sidebar-footer] {
		transform: translateX(0.5rem);
	}

	aside[data-side='right'] [data-native-sidebar-body] {
		transform: translateX(0.3125rem);
	}

	aside[data-side='right'] [data-native-sidebar-header] {
		flex-direction: row-reverse;
		transform: translateX(-0.125rem);
	}

	aside[data-side='right'] :global(a) {
		flex-direction: row-reverse;
		text-align: end;
	}

	aside[data-side='right'] [data-native-sidebar-footer] :global(button) {
		flex-direction: row-reverse;
		text-align: end;
	}

	aside:is(:hover, :focus-within) [data-native-sidebar-header-label],
	aside:is(:hover, :focus-within) :global([data-native-sidebar-section-title]),
	aside:is(:hover, :focus-within)
		:global([data-native-sidebar-link] > span:not([aria-hidden='true'])) {
		opacity: 1;
	}

	aside:has(:global([aria-busy='true'])) [data-native-sidebar-header-label],
	aside:has(:global([popover]:popover-open)) [data-native-sidebar-header-label],
	aside:has(:global([aria-busy='true'])) :global([data-native-sidebar-section-title]),
	aside:has(:global([popover]:popover-open)) :global([data-native-sidebar-section-title]),
	aside:has(:global([aria-busy='true']))
		:global([data-native-sidebar-link] > span:not([aria-hidden='true'])),
	aside:has(:global([popover]:popover-open))
		:global([data-native-sidebar-link] > span:not([aria-hidden='true'])) {
		opacity: 1;
	}

	aside[data-side='right'] {
		margin-inline-start: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		aside,
		[data-native-sidebar-panel],
		[data-native-sidebar-header-label],
		aside :global([data-native-sidebar-section-title]),
		aside :global([data-native-sidebar-link] > span:not([aria-hidden='true'])) {
			transition-duration: 1ms;
		}
	}
</style>
