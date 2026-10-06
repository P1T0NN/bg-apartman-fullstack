<script lang="ts">
	// COMPONENTS
	import Switch from '@/components/ui/switch/switch.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		icon,
		label,
		description,
		checked,
		disabled = false,
		onCheckedChange,
		control,
		class: className
	}: {
		icon: string;
		label: string;
		description: string;
		checked: boolean;
		disabled?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		/** Custom control rendered instead of the default Switch; receives the field ids for a11y wiring. */
		control?: Snippet<[{ id: string; labelId: string; descriptionId: string }]>;
		class?: string;
	} = $props();

	const id = $props.id();
	const labelId = `${id}-label`;
	const descriptionId = `${id}-description`;
</script>

<!--
	The whole card is a <label>, so clicking anywhere activates its control.
	Off = dashed outline, muted icon tile -> "this option isn't applied"
	On  = solid outline, filled icon tile -> "this option is applied"
-->
<label
	for={id}
	class={cn(
		'flex w-full items-center gap-4 rounded-3xl border p-4 pr-5 transition-[background-color,border-color,box-shadow] duration-200',
		'has-focus-visible:ring-3 has-focus-visible:ring-ring/40',
		checked ? 'border-primary/30 bg-card shadow-sm' : 'border-dashed border-border bg-transparent',
		disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
		!checked && !disabled && 'hover:bg-muted/40',
		className
	)}
>
	<span
		class={cn(
			'grid size-12 shrink-0 place-items-center rounded-2xl transition-colors duration-200',
			checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
		)}
		aria-hidden="true"
	>
		<span class={cn(icon, 'size-6')}></span>
	</span>

	<span class="flex min-w-0 flex-1 flex-col gap-0.5">
		<span id={labelId} class="text-sm leading-snug font-medium text-foreground">{label}</span>
		<span id={descriptionId} class="text-sm leading-snug text-pretty text-muted-foreground">
			{description}
		</span>
	</span>

	{#if control}
		{@render control({ id, labelId, descriptionId })}
	{:else}
		<Switch
			{id}
			{checked}
			{disabled}
			{onCheckedChange}
			aria-labelledby={labelId}
			aria-describedby={descriptionId}
			class="shrink-0"
		/>
	{/if}
</label>
