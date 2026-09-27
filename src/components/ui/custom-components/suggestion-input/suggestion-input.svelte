<script lang="ts">
	// COMPONENTS
	import * as InputGroup from '@/components/ui/input-group/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ComponentProps, Snippet } from 'svelte';

	type Props = Omit<ComponentProps<typeof InputGroup.Input>, 'type' | 'value' | 'files'> & {
		value?: string;
		/** Accessible name; defaults to the placeholder. */
		label?: string | null;
		/** Accessible name of the clear button. */
		clearLabel: string;
		/** Iconify classes for the leading icon. */
		icon?: string;
		/** Optional suggestion markup rendered below the input. */
		dropdown?: Snippet;
		/** Controls whether the optional suggestion markup is visible. */
		dropdownOpen?: boolean;
		/** Accessible name of the suggestion listbox. */
		dropdownLabel?: string;
		/** Called after the clear button empties the value. */
		onClear?: () => void;
	};

	let {
		value = $bindable(''),
		placeholder = '',
		label = placeholder,
		clearLabel,
		icon = 'icon-[lucide--search]',
		dropdown,
		dropdownOpen = true,
		dropdownLabel,
		onClear,
		class: className,
		disabled = false,
		...restProps
	}: Props = $props();

	const componentId = $props.id();
	const dropdownId = `${componentId}-dropdown`;

	function clearValue(): void {
		value = '';
		onClear?.();
	}
</script>

<div class={cn('relative w-full', className)}>
	<InputGroup.Root class="group">
		<InputGroup.Addon
			align="inline-start"
			class="transition-colors group-focus-within:text-foreground"
		>
			<span class={cn(icon, 'size-4')} aria-hidden="true"></span>
		</InputGroup.Addon>

		<InputGroup.Input
			bind:value
			type="search"
			{placeholder}
			aria-label={label}
			aria-autocomplete={dropdown ? 'list' : undefined}
			aria-controls={dropdown && dropdownOpen ? dropdownId : undefined}
			aria-expanded={dropdown ? dropdownOpen : undefined}
			aria-haspopup={dropdown ? 'listbox' : undefined}
			class="[&::-webkit-search-cancel-button]:hidden"
			{disabled}
			{...restProps}
		/>

		<InputGroup.Addon align="inline-end">
			<InputGroup.Button
				variant="ghost"
				size="icon-xs"
				class={cn(
					'rounded-full text-muted-foreground transition-none hover:text-foreground',
					!value && 'pointer-events-none invisible'
				)}
				onclick={clearValue}
				aria-label={clearLabel}
				disabled={!value || disabled}
				title={clearLabel}
			>
				<span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>

	{#if dropdown && dropdownOpen}
		<div
			id={dropdownId}
			role="listbox"
			aria-label={dropdownLabel}
			class="absolute top-full right-0 left-0 z-10 mt-2 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
		>
			{@render dropdown()}
		</div>
	{/if}
</div>
