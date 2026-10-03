<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		href,
		icon,
		label
	}: {
		href: string;
		/** Iconify classes for the leading icon. */
		icon: string;
		label: string;
	} = $props();
</script>

<Button variant="outline" {href} class="sidebar-cta w-full justify-start">
	<span class={cn(icon, 'size-4')} aria-hidden="true"></span>
	<span class="sidebar-cta-label truncate">{label}</span>
</Button>

<style>
	/* Collapsed: an icon-only circle that expands with the sidebar's hover/focus state. */
	:global(aside [data-native-sidebar-footer] .sidebar-cta) {
		inline-size: 2rem;
		block-size: 2rem;
		margin-inline-start: 0.5rem;
		padding-inline: 0;
		border-radius: 9999px;
		justify-content: center;
		transition: inline-size 180ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	:global(aside [data-native-sidebar-footer] .sidebar-cta .sidebar-cta-label) {
		display: none;
	}

	:global(aside:is(:hover, :focus-within) [data-native-sidebar-footer] .sidebar-cta),
	:global(aside:has([popover]:popover-open) [data-native-sidebar-footer] .sidebar-cta) {
		inline-size: 100%;
		block-size: 2rem;
		margin-inline-start: 0;
		padding-inline: 0.75rem;
		border-radius: var(--radius-4xl);
		justify-content: flex-start;
	}

	:global(
		aside:is(:hover, :focus-within) [data-native-sidebar-footer] .sidebar-cta .sidebar-cta-label
	),
	:global(
		aside:has([popover]:popover-open) [data-native-sidebar-footer] .sidebar-cta .sidebar-cta-label
	) {
		display: block;
	}
</style>
