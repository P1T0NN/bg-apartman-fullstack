<script lang="ts">
	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import * as InputGroup from '@/components/ui/input-group/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof NativeSelect> & {
		disabled?: boolean;
		searchLabel: string;
		searchPlaceholder?: string;
		emptyMessage: string;
	};

	let {
		options,
		value = $bindable(''),
		onchange,
		searchLabel,
		searchPlaceholder = searchLabel,
		emptyMessage,
		class: className,
		disabled = false,
		...selectProps
	}: Props = $props();

	const uid = $props.id();
	let query = $state('');
	const search = $derived(query.trim().toLowerCase());
	const matches = $derived(
		options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(search))
	);
	// Keep the saved value present so filtering cannot silently select another option.
	const selected = $derived(options.find((option) => option.value === value));
	const displayOptions = $derived(
		selected && !matches.some((option) => option.value === value) ? [selected, ...matches] : matches
	);

	function selectValue(nextValue: string): void {
		if (disabled) return;
		value = nextValue;
		onchange?.(nextValue);
	}
</script>

<fieldset {disabled} aria-label={searchLabel} class={cn('flex w-full flex-col gap-2', className)}>
	<InputGroup.Root>
		<InputGroup.Input
			bind:value={query}
			type="search"
			placeholder={searchPlaceholder}
			aria-label={searchLabel}
			aria-controls={selectProps.id}
			aria-describedby={matches.length === 0 ? `${uid}-empty` : undefined}
			{disabled}
		/>
		<InputGroup.Addon align="inline-start">
			<span class="icon-[lucide--search]" aria-hidden="true"></span>
		</InputGroup.Addon>
	</InputGroup.Root>

	<NativeSelect
		{...{ ...selectProps, disabled }}
		options={displayOptions}
		{value}
		onchange={selectValue}
		class="w-full aria-invalid:border-destructive"
	/>

	{#if matches.length === 0}
		<p id={`${uid}-empty`} role="status" class="text-sm text-muted-foreground">
			{emptyMessage}
		</p>
	{/if}
</fieldset>
