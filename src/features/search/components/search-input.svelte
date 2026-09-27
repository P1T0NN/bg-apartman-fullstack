<script lang="ts">
	// COMPONENTS
	import SuggestionInput from '@/components/ui/custom-components/suggestion-input/suggestion-input.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { ComponentProps } from 'svelte';

	type Props = Omit<ComponentProps<typeof SuggestionInput>, 'clearLabel'> & {
		/** Accessible name of the clear button; defaults to a search-specific label. */
		clearLabel?: string;
		/** Accessible name; defaults to the placeholder. */
		label?: string | null;
	};

	let {
		value = $bindable(''),
		placeholder = m['SearchFeature.SearchInput.searchPlaceholder'](),
		clearLabel = m['SearchFeature.SearchInput.clearSearch'](),
		label = placeholder,
		...restProps
	}: Props = $props();
</script>

<SuggestionInput bind:value {placeholder} {label} {clearLabel} {...restProps} />
