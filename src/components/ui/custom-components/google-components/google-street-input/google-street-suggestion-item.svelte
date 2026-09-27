<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		id,
		label,
		secondaryText,
		active,
		onSelect
	}: {
		id: string;
		label: string;
		secondaryText: string;
		active: boolean;
		onSelect: () => void;
	} = $props();
</script>

<button
	{id}
	type="button"
	role="option"
	aria-selected={active}
	tabindex="-1"
	class={cn(
		'flex min-h-12 w-full flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
		active && 'bg-accent'
	)}
	onpointerdown={(event) => event.preventDefault()}
	onclick={onSelect}
>
	<span class="font-medium">{label}</span>
	{#if secondaryText}<span class="text-xs text-muted-foreground">{secondaryText}</span>{/if}
</button>
