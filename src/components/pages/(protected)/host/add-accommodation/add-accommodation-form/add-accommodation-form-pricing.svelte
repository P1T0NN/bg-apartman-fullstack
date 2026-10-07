<script lang="ts">
	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import AccommodationPrice from '@/features/accommodations/components/accommodation-price/accommodation-price.svelte';
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import FormSelect from '@/components/ui/custom-components/form/form-select.svelte';
	import FormInput from '@/components/ui/custom-components/form/form-input.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { ACCOMMODATION_BILLING_PLANS } from '@/shared/features/accommodations/config.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// UTILS
	import { calculateAccommodationPricing } from '@/shared/features/accommodations/utils/calculateAccommodationPricing.js';

	// SCHEMAS
	import { accommodationPricingSchema } from '@/shared/features/accommodations/schemas/accommodationSchemas.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue,
		InputField,
		SelectField
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const form = getAccommodationFormContext();
	const billingId = $props.id();
	const pricing = $derived(accommodationPricingSchema.safeParse(context.values));
	const discountField = $derived<InputField>({
		kind: 'input',
		type: 'number',
		name: 'discountPercent',
		label: m['AccommodationsFeature.Pricing.discount'](),
		description: m['AccommodationsFeature.Pricing.discountHint'](),
		min: 0,
		max: 99.99,
		step: 0.01,
		required: true
	});
	const weekendField = $derived<InputField>({
		kind: 'input',
		type: 'number',
		name: 'weekendPrice',
		label: m['AccommodationsFeature.Pricing.weekend'](),
		description: m['AccommodationsFeature.Pricing.weekendHint'](),
		min: 0.01,
		max: 100000,
		step: 0.01
	});

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
	const paymentField = $derived<SelectField>({
		kind: 'select',
		name: 'supportedPaymentMethods',
		label: m['PaymentsFeature.supported'](),
		required: true,
		options: (['cash', 'online', 'both'] as const).map((value) => ({
			value,
			label: m[`PaymentsFeature.supportedOptions.${value}`]()
		}))
	});
	const stayPresets = $derived([
		{ days: 1, label: m['AddAccommodationPage.AddAccommodationFormPricing.oneDay']() },
		{ days: 7, label: m['AddAccommodationPage.AddAccommodationFormPricing.sevenDays']() },
		{ days: 30, label: m['AddAccommodationPage.AddAccommodationFormPricing.thirtyDays']() }
	]);
</script>

<Field.Group>
	<Field.Set
		disabled={context.disabled}
		aria-describedby={`${billingId}-hint`}
		data-invalid={Boolean(context.errors.billingPlanId)}
	>
		<Field.Legend>
			{m['AddAccommodationPage.AddAccommodationFormPricing.billingTitle']()}
		</Field.Legend>
		<p id={`${billingId}-hint`} class="text-sm text-muted-foreground">
			{m['AddAccommodationPage.AddAccommodationFormPricing.billingHint']()}
		</p>
		<label
			class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-checked:border-primary has-checked:bg-muted/40"
		>
			<input
				type="radio"
				name="billingPlanId"
				value="flat_fee"
				required
				checked={context.inputValue('billingPlanId') === 'flat_fee'}
				aria-describedby={context.errors.billingPlanId ? `${billingId}-error` : undefined}
				onchange={() => context.setValue('billingPlanId', 'flat_fee')}
				class="mt-1 size-4 shrink-0 accent-primary"
			/>
			<span class="flex flex-col gap-1">
				<span class="font-medium">
					{m['AddAccommodationPage.AddAccommodationFormPricing.flatFee']({
						amount: ACCOMMODATION_BILLING_PLANS.flat_fee.amountMinor / 100,
						months: ACCOMMODATION_BILLING_PLANS.flat_fee.intervalMonths
					})}
				</span>
				<span class="text-sm text-muted-foreground">
					{m['AddAccommodationPage.AddAccommodationFormPricing.flatFeeHint']()}
				</span>
			</span>
		</label>
		<label
			class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-checked:border-primary has-checked:bg-muted/40"
		>
			<input
				type="radio"
				name="billingPlanId"
				value="booking_fee"
				required
				checked={context.inputValue('billingPlanId') === 'booking_fee'}
				aria-describedby={context.errors.billingPlanId ? `${billingId}-error` : undefined}
				onchange={() => context.setValue('billingPlanId', 'booking_fee')}
				class="mt-1 size-4 shrink-0 accent-primary"
			/>
			<span class="flex flex-col gap-1">
				<span class="font-medium">
					{m['AddAccommodationPage.AddAccommodationFormPricing.bookingFee']()}
				</span>

				<span class="text-sm text-muted-foreground">
					{m['AddAccommodationPage.AddAccommodationFormPricing.bookingFeeHint']({
						percent: ACCOMMODATION_BILLING_PLANS.booking_fee.commissionBps / 100
					})}
				</span>
			</span>
		</label>

		{#if context.errors.billingPlanId}
			<p id={`${billingId}-error`} class="text-sm text-destructive" role="alert">
				{context.errors.billingPlanId}
			</p>
		{/if}
	</Field.Set>

	<FormInput
		field={nightlyPriceField}
		value={context.inputValue(nightlyPriceField.name)}
		error={context.errors[nightlyPriceField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(nightlyPriceField.name, value)}
	/>

	<FormInput
		field={discountField}
		value={context.inputValue(discountField.name)}
		error={context.errors[discountField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(discountField.name, value)}
	/>

	<FormInput
		field={weekendField}
		value={context.inputValue(weekendField.name)}
		error={context.errors[weekendField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(weekendField.name, value)}
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

	<FormSelect
		field={paymentField}
		value={context.inputValue(paymentField.name)}
		error={context.errors[paymentField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(paymentField.name, value)}
	/>

	{#if pricing.success}
		<div class="rounded-lg bg-muted p-4">
			<p class="mb-2 text-sm text-muted-foreground">
				{m['AccommodationsFeature.Pricing.preview']()}
			</p>
			<p class="text-lg font-semibold">
				<AccommodationPrice
					pricing={calculateAccommodationPricing(
						pricing.data.nightlyPrice,
						pricing.data.discountPercent,
						pricing.data.weekendPrice
					)}
				/>
			</p>

			{#if pricing.data.weekendPrice !== null}
				<p class="mt-3 flex flex-wrap justify-between gap-2 text-sm">
					<span>{m['AccommodationsFeature.Pricing.weekend']()}</span>
					<AccommodationPrice
						pricing={calculateAccommodationPricing(
							pricing.data.weekendPrice,
							pricing.data.discountPercent
						)}
					/>
				</p>
			{/if}
		</div>
	{/if}
</Field.Group>

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}>
		{m['AddAccommodationPage.AddAccommodationFormPricing.previous']()}
	</Button>
	<AddAccommodationContinueButton errors={context.errors} />
</div>
