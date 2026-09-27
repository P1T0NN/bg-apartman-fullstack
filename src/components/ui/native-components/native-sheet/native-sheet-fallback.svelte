<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// COMPONENTS
	import * as Sheet from '@/components/ui/sheet/index.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		trigger,
		children,
		class: className,
		label,
		triggerLabel
	}: {
		trigger?: Snippet;
		children: Snippet;
		class?: string;
		label: string;
		triggerLabel?: string;
	} = $props();
</script>

<Sheet.Root>
	{#if trigger}
		<Sheet.Trigger
			aria-label={triggerLabel ?? m['Components.NativeSheetFallback.open']()}
			class="inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
		>
			{@render trigger()}
		</Sheet.Trigger>
	{:else}
		<Sheet.Trigger aria-label={m['Components.NativeSheetFallback.open']()}>
			{m['Components.NativeSheetFallback.open']()}
		</Sheet.Trigger>
	{/if}

	<Sheet.Content
		side="right"
		class={cn(
			'box-border h-dvh max-h-none w-full max-w-md border bg-sidebar p-6 pt-14 text-sidebar-foreground',
			className
		)}
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>{label}</Sheet.Title>
			<Sheet.Description>{m['Components.NativeSheetFallback.description']()}</Sheet.Description>
		</Sheet.Header>

		{@render children()}
	</Sheet.Content>
</Sheet.Root>
