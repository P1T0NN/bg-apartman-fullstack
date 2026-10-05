<script lang="ts">
	// COMPONENTS
	import AccommodationReservationRulesField from '@/features/accommodations/components/accommodation-reservation-rules/accommodation-reservation-rules-field.svelte';

	import AccommodationBookingModeField from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode-field.svelte';
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import AccommodationRuleCard from '@/features/accommodations/components/accommodation-rule-card/accommodation-rule-card.svelte';
	import AccommodationTimeZone from '@/features/accommodations/components/accommodation-time-zone/accommodation-time-zone.svelte';
	import FormSelect from '@/components/ui/custom-components/form/form-select.svelte';
	import FormTextarea from '@/components/ui/custom-components/form/form-textarea.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// UTILS
	import { getTimeSlots } from '@/utils/getTimeSlots.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue,
		SelectField
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const form = getAccommodationFormContext();
	const timeSlots = getTimeSlots();

	const checkInFields = $derived<SelectField[]>([
		{
			kind: 'select',
			name: 'checkInStart',
			label: m['AddAccommodationPage.AddAccommodationFormRules.checkInStart'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.checkInWindowHint'](),
			options: timeSlots,
			required: true,
			class: 'max-w-40'
		},
		{
			kind: 'select',
			name: 'checkInEnd',
			label: m['AddAccommodationPage.AddAccommodationFormRules.checkInEnd'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.checkInWindowHint'](),
			options: timeSlots,
			required: true,
			class: 'max-w-40'
		}
	]);
	const checkOutField = $derived<SelectField>({
		kind: 'select',
		name: 'checkOut',
		label: m['AddAccommodationPage.AddAccommodationFormRules.checkOut'](),
		description: m['AddAccommodationPage.AddAccommodationFormRules.checkOutHint'](),
		options: timeSlots,
		required: true,
		class: 'max-w-40'
	});
	const rules = $derived([
		{
			name: 'smokingAllowed',
			icon: 'icon-[lucide--cigarette]',
			label: m['AddAccommodationPage.AddAccommodationFormRules.smokingAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.smokingAllowedHint']()
		},
		{
			name: 'petsAllowed',
			icon: 'icon-[lucide--paw-print]',
			label: m['AddAccommodationPage.AddAccommodationFormRules.petsAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.petsAllowedHint']()
		},
		{
			name: 'partiesAllowed',
			icon: 'icon-[lucide--party-popper]',
			label: m['AddAccommodationPage.AddAccommodationFormRules.partiesAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.partiesAllowedHint']()
		}
	]);
</script>

<Field.Group>
	<AccommodationBookingModeField {context} />
	<AccommodationTimeZone {context} />
	<AccommodationReservationRulesField {context} />

	<div class="flex flex-row gap-4">
		{#each checkInFields as field (field.name)}
			<FormSelect
				{field}
				value={context.inputValue(field.name)}
				error={context.errors[field.name]}
				disabled={context.disabled}
				onValueChange={(value) => context.setValue(field.name, value)}
			/>
		{/each}
	</div>

	<FormSelect
		field={checkOutField}
		value={context.inputValue(checkOutField.name)}
		error={context.errors[checkOutField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(checkOutField.name, value)}
	/>

	{#each rules as rule (rule.name)}
		<AccommodationRuleCard
			icon={rule.icon}
			label={rule.label}
			description={rule.description}
			checked={context.checkboxValue(rule.name)}
			disabled={context.disabled}
			onCheckedChange={(checked) => context.setValue(rule.name, checked)}
		/>
	{/each}

	<FormTextarea
		field={{
			kind: 'textarea',
			name: 'houseRules',
			label: m['AddAccommodationPage.AddAccommodationFormRules.houseRules'](),
			placeholder: m['AddAccommodationPage.AddAccommodationFormRules.houseRulesPlaceholder']()
		}}
		value={context.inputValue('houseRules')}
		error={context.errors['houseRules']}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue('houseRules', value)}
	/>
</Field.Group>

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}>
		{m['AddAccommodationPage.AddAccommodationFormRules.previous']()}
	</Button>
	<AddAccommodationContinueButton errors={context.errors} />
</div>
