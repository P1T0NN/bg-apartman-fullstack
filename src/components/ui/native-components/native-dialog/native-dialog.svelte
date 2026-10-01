<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';

	// Native <dialog> modal: the browser blocks the page behind it, centers it
	// with a backdrop, and focuses the first control. Click-outside can never
	// close a modal <dialog>; Esc is disabled by cancelling the `cancel` event,
	// so the only exits are the close affordances the caller renders via the
	// `close` snippet arg or a native command button. Both snippets expose `id`
	// for commandfor with command="show-modal" or command="close". The existing
	// `open`/`close` handlers remain available for programmatic workflows.
	// `whitespace-normal` resets inherited `nowrap` when a trigger lives inside a
	// table cell, so dialog text still wraps there.
	const defaultId = $props.id();
	let {
		id = defaultId,
		trigger,
		children,
		onbeforetoggle,
		onclose,
		'aria-labelledby': labelledBy,
		class: className
	}: {
		id?: string;
		trigger?: Snippet<[{ id: string; open: () => void }]>;
		children: Snippet<[{ id: string; close: () => void }]>;
		onbeforetoggle?: HTMLDialogAttributes['onbeforetoggle'];
		onclose?: HTMLDialogAttributes['onclose'];
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
	{@render trigger?.({ id, open })}
{/if}

<dialog
	{id}
	aria-labelledby={labelledBy}
	{@attach setDialogElement}
	{onbeforetoggle}
	{onclose}
	oncancel={(e) => e.preventDefault()}
	class={cn(
		'm-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-x-auto overflow-y-auto rounded-2xl border bg-popover p-0 [overflow-wrap:anywhere] whitespace-normal text-popover-foreground shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm',
		className
	)}
>
	{@render children?.({ id, close })}
</dialog>
