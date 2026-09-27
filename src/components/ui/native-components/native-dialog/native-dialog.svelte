<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// Native <dialog> modal: the browser blocks the page behind it, centers it
	// with a backdrop, and focuses the first control. Click-outside can never
	// close a modal <dialog>; Esc is disabled by cancelling the `cancel` event,
	// so the only exits are the close affordances the caller renders via the
	// `close` snippet arg. The dialog element is the source of truth — `open`
	// and `close` are plain event handlers on the native API, so there is no
	// state to sync and no $effect. The trigger snippet must be a button (or
	// another element with `onclick`); pass the `open` handler to it.
	let {
		trigger,
		children,
		'aria-labelledby': labelledBy,
		class: className
	}: {
		trigger?: Snippet<[{ open: () => void }]>;
		children: Snippet<[{ close: () => void }]>;
		'aria-labelledby'?: string;
		class?: string;
	} = $props();

	let dialogEl = $state<HTMLDialogElement>();

	function setDialogElement(element: HTMLDialogElement) {
		dialogEl = element;
	}

	export const open = () => dialogEl?.showModal();
	export const close = () => dialogEl?.close();
</script>

{#if trigger}
	{@render trigger?.({ open })}
{/if}

<dialog
	aria-labelledby={labelledBy}
	{@attach setDialogElement}
	oncancel={(e) => e.preventDefault()}
	class={cn(
		'm-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-x-auto overflow-y-auto rounded-2xl border bg-popover p-0 [overflow-wrap:anywhere] text-popover-foreground shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm',
		className
	)}
>
	{@render children?.({ close })}
</dialog>
