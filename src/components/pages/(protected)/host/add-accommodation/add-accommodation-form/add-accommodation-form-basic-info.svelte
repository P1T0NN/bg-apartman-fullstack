<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import FormCounter from '@/components/ui/custom-components/form/form-counter.svelte';
	import FormSelect from '@/components/ui/custom-components/form/form-select.svelte';
	import * as Field from '@/components/ui/field/index.js';

	// TYPES
	import type {
		CounterField,
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const counters = $derived<CounterField[]>([
		{
			kind: 'counter',
			name: 'maxGuests',
			label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.guests'](),
			min: 1,
			max: 100,
			class: 'max-w-sm'
		},
		{
			kind: 'counter',
			name: 'bedrooms',
			label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.bedrooms'](),
			min: 0,
			max: 100,
			class: 'max-w-sm'
		},
		{
			kind: 'counter',
			name: 'beds',
			label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.beds'](),
			min: 1,
			max: 100,
			class: 'max-w-sm'
		},
		{
			kind: 'counter',
			name: 'bathrooms',
			label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.bathrooms'](),
			min: 1,
			max: 100,
			class: 'max-w-sm'
		}
	]);
</script>

<Field.Group>
	<FormSelect
		field={{
			kind: 'select',
			name: 'type',
			label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.type'](),
			class: 'max-w-xs',
			options: [
				{
					value: 'apartment',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.apartment']()
				},
				{
					value: 'studio',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.studio']()
				},
				{ value: 'house', label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.house']() },
				{ value: 'villa', label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.villa']() },
				{ value: 'room', label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.room']() },
				{ value: 'other', label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.other']() }
			]
		}}
		value={context.inputValue('type')}
		error={context.errors['type']}
		disabled={context.disabled}
		onValueChange={(value) => {
			context.setValue('type', value);
			if (value === 'studio') context.setValue('bedrooms', 0);
		}}
	/>

	<FormSelect
		field={{
			kind: 'select',
			name: 'spaceType',
			label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.spaceType'](),
			class: 'max-w-xs',
			options: [
				{
					value: 'entire',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.entire']()
				},
				{
					value: 'private',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.private']()
				},
				{ value: 'shared', label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.shared']() }
			]
		}}
		value={context.inputValue('spaceType')}
		error={context.errors['spaceType']}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue('spaceType', value)}
	/>

	{#each counters as field (field.name)}
		{#if field.name !== 'bedrooms' || context.getValue('type') !== 'studio'}
			<FormCounter
				{field}
				value={context.numberValue(field.name, field.min ?? 0)}
				error={context.errors[field.name]}
				disabled={context.disabled}
				onValueChange={(value) => context.setValue(field.name, value)}
			/>
		{/if}
	{/each}
</Field.Group>

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<AddAccommodationContinueButton errors={context.errors} />
</div>
