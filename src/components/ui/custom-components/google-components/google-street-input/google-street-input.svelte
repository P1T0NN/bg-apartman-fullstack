<script lang="ts">
	// COMPONENTS
	import FormField from '@/components/ui/custom-components/form/form-field.svelte';
	import SuggestionInput from '@/components/ui/custom-components/suggestion-input/suggestion-input.svelte';
	import GoogleStreetInputLoading from './google-street-input-loading.svelte';
	import GoogleStreetSuggestionItem from './google-street-suggestion-item.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { formControlAttrs } from '@/components/ui/custom-components/form/formControl.js';
	import { useGoogleStreetSearch } from './useGoogleStreetSearch.svelte.js';

	// TYPES
	import type { StreetSuggestion } from './googleStreetInputSchemas.js';
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const uid = $props.id();
	const optionId = (index: number) => `${uid}-option-${index}`;

	const field = $derived({
		name: 'address.street',
		label: m['Components.GoogleStreetInput.label'](),
		required: true
	});

	let previousAddress: Record<'city' | 'country' | 'postalCode', string> | undefined;

	const search = useGoogleStreetSearch({
		getDisabled: () => context.disabled,
		onStreetChange: (street) => context.setValue('address.street', street),
		onAddress: (address) => {
			const previous = previousAddress;
			if (!previous) return;
			const changes = {
				city: address.city ?? '',
				country: address.country ?? '',
				postalCode: address.postalCode ?? ''
			};
			// A slow lookup must not overwrite fields the host has already corrected.
			for (const key of ['city', 'country', 'postalCode'] as const) {
				if (context.inputValue('address.' + key) === previous[key])
					context.setValue('address.' + key, changes[key]);
			}
		}
	});

	function selectSuggestion(suggestion: StreetSuggestion) {
		previousAddress = {
			city: context.inputValue('address.city'),
			country: context.inputValue('address.country'),
			postalCode: context.inputValue('address.postalCode')
		};
		void search.select(suggestion);
	}
</script>

<FormField {field} error={context.errors[field.name]} disabled={context.disabled}>
	<SuggestionInput
		{...formControlAttrs(field, context.errors[field.name])}
		value={context.inputValue(field.name)}
		disabled={context.disabled}
		label={field.label}
		placeholder={m['Components.GoogleStreetInput.placeholder']()}
		maxlength={200}
		required
		autocomplete="off"
		role="combobox"
		icon="icon-[lucide--map-pin]"
		clearLabel={m['Components.GoogleStreetInput.clear']()}
		dropdownLabel={m['Components.GoogleStreetInput.suggestions']()}
		dropdownOpen={search.dropdownOpen && !context.disabled}
		aria-activedescendant={search.active >= 0 ? optionId(search.active) : undefined}
		aria-busy={search.busy}
		oninput={(event) => search.change(event.currentTarget.value)}
		onClear={() => search.change('')}
		onkeydown={(event) => search.keydown(event, optionId)}
		onblur={search.close}
	>
		{#snippet dropdown()}
			{#if search.loading}
				{#each [0, 1, 2] as index (index)}
					<GoogleStreetInputLoading />
				{/each}
			{:else}
				{#each search.suggestions as suggestion, index (suggestion.placeId)}
					<GoogleStreetSuggestionItem
						id={optionId(index)}
						label={suggestion.mainText}
						secondaryText={suggestion.secondaryText}
						active={search.active === index}
						onSelect={() => selectSuggestion(suggestion)}
					/>
				{/each}

				<div
					class="px-3 pt-2 pb-1 text-right text-xs font-normal text-muted-foreground"
					translate="no"
				>
					Google Maps
				</div>
			{/if}
		{/snippet}
	</SuggestionInput>

	<p class="text-sm text-muted-foreground">{m['Components.GoogleStreetInput.hint']()}</p>
	<p class="text-sm text-muted-foreground" role="status">
		{#if search.status === 'loading' || search.status === 'details'}{m[
				'Components.GoogleStreetInput.loading'
			]()}
		{:else if search.status === 'failed'}{m['Components.GoogleStreetInput.unavailable']()}
		{:else if search.status === 'empty'}{m['Components.GoogleStreetInput.noResults']()}{/if}
	</p>
</FormField>
