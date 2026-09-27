<script lang="ts">
	// COMPONENTS
	import { FieldDescription, FieldError } from '@/components/ui/field/index.js';
	import Counter from '../counter/counter.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { CounterField } from './formTypes.js';

	type Props = {
		field: CounterField;
		value: number;
		disabled?: boolean;
		error?: string;
		onValueChange: (value: number) => void;
	};

	let { field, value, disabled = false, error, onValueChange }: Props = $props();

	const label = $derived(field.label ?? field.name);
</script>

<div
	id={field.name}
	class={cn('flex w-full flex-col gap-1', field.class)}
	data-disabled={disabled}
	aria-invalid={error ? 'true' : undefined}
	aria-describedby={error ? `${field.name}-error` : undefined}
>
	<Counter
		bind:value={() => value, (nextValue) => onValueChange(nextValue)}
		{label}
		min={field.min}
		max={field.max}
		{disabled}
	/>

	{#if field.description}
		<FieldDescription>{field.description}</FieldDescription>
	{/if}

	{#if error}
		<FieldError id={`${field.name}-error`}>{error}</FieldError>
	{/if}
</div>
