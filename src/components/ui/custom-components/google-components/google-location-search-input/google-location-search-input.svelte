<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SuggestionInput from '@/components/ui/custom-components/suggestion-input/suggestion-input.svelte';

	// HOOKS
	import { useGooglePlacesSearch } from './useGooglePlacesSearch.svelte.js';

	// TYPES
	import type { PlaceSelection } from './types.js';
	import type { ComponentProps } from 'svelte';

	type Props = Omit<
		ComponentProps<typeof SuggestionInput>,
		'clearLabel' | 'icon' | 'dropdown' | 'dropdownOpen' | 'dropdownLabel' | 'onClear' | 'value'
	> & {
		value?: string;
		/** Selected Google place ID; `null` for free text. */
		place?: PlaceSelection | null;
	};

	let {
		value = $bindable(''),
		place = $bindable<PlaceSelection | null>(null),
		disabled = false,
		class: className,
		oninput,
		...restProps
	}: Props = $props();

	const places = useGooglePlacesSearch({
		onSelect: (selection) => {
			value = selection.label;
			place = { placeId: selection.placeId };
		}
	});

	const showSuggestions = $derived(places.open && places.suggestions.length > 0);

	function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
		oninput?.(event);
		place = null;
		places.search(event.currentTarget.value.trim());
	}

	function handleClear(): void {
		place = null;
		places.reset();
	}

	function handleFocusOut(event: FocusEvent & { currentTarget: EventTarget & HTMLElement }): void {
		const nextTarget = event.relatedTarget;
		const focusStaysInside = nextTarget instanceof Node && event.currentTarget.contains(nextTarget);
		if (!focusStaysInside) places.close();
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') places.close();
	}
</script>

<div onfocusout={handleFocusOut}>
	<SuggestionInput
		bind:value
		{disabled}
		class={className}
		icon="icon-[lucide--map-pin]"
		clearLabel={m['Components.GoogleLocationSearchInput.clear']()}
		dropdownLabel={m['Components.GoogleLocationSearchInput.suggestions']()}
		dropdownOpen={showSuggestions}
		onClear={handleClear}
		autocomplete="off"
		{...restProps}
		oninput={handleInput}
		onkeydown={handleKeyDown}
	>
		{#snippet dropdown()}
			{#each places.suggestions as suggestion (suggestion.placeId)}
				<button
					type="button"
					role="option"
					aria-selected="false"
					class="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onclick={() => places.select(suggestion)}
				>
					{suggestion.label}
				</button>
			{/each}
		{/snippet}
	</SuggestionInput>
</div>
