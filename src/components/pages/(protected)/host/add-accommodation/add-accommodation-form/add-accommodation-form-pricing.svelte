<script lang="ts">
	// COMPONENTS
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import FormInput from '@/components/ui/custom-components/form/form-input.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue,
		InputField
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();
	const form = getAccommodationFormContext();

	const nightlyPriceField = $derived<InputField>({
		kind: 'input',
		type: 'number',
		name: 'nightlyPrice',
		label: m['AddAccommodationPage.AddAccommodationFormPricing.nightlyPrice'](),
		placeholder: m['AddAccommodationPage.AddAccommodationFormPricing.nightlyPricePlaceholder'](),
		required: true,
		class: 'max-w-48'
	});
	const minimumStayField = $derived<InputField>({
		kind: 'input',
		type: 'number',
		name: 'minimumStay',
		label: m['AddAccommodationPage.AddAccommodationFormPricing.minimumStay'](),
		placeholder: m['AddAccommodationPage.AddAccommodationFormPricing.minimumStayPlaceholder'](),
		required: true,
		class: 'max-w-40'
	});
	const maximumStayField = $derived<InputField>({
		kind: 'input',
		type: 'number',
		name: 'maximumStay',
		label: m['AddAccommodationPage.AddAccommodationFormPricing.maximumStay'](),
		placeholder: m['AddAccommodationPage.AddAccommodationFormPricing.maximumStayPlaceholder'](),
		class: 'max-w-40'
	});
	const stayPresets = $derived([
		{ days: 1, label: m['AddAccommodationPage.AddAccommodationFormPricing.oneDay']() },
		{ days: 7, label: m['AddAccommodationPage.AddAccommodationFormPricing.sevenDays']() },
		{ days: 30, label: m['AddAccommodationPage.AddAccommodationFormPricing.thirtyDays']() }
	]);
</script>

<Field.Group>
	<FormInput
		field={nightlyPriceField}
		value={context.inputValue(nightlyPriceField.name)}
		error={context.errors[nightlyPriceField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(nightlyPriceField.name, value)}
	/>

	<div class="flex flex-col gap-2">
		<FormInput
			field={minimumStayField}
			value={context.inputValue(minimumStayField.name)}
			error={context.errors[minimumStayField.name]}
			disabled={context.disabled}
			onValueChange={(value) => context.setValue(minimumStayField.name, value)}
		/>

		<div class="flex flex-wrap gap-2">
			{#each stayPresets as preset (preset.days)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={context.disabled}
					onclick={() => context.setValue('minimumStay', preset.days)}
				>
					{preset.label}
				</Button>
			{/each}
		</div>
	</div>

	<FormInput
		field={maximumStayField}
		value={context.inputValue(maximumStayField.name)}
		error={context.errors[maximumStayField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(maximumStayField.name, value)}
	/>
</Field.Group>

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}>
		{m['AddAccommodationPage.AddAccommodationFormPricing.previous']()}
	</Button>
	<AddAccommodationContinueButton errors={context.errors} />
</div>
