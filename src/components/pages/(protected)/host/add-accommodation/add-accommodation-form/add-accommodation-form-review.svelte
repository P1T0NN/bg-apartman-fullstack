<script lang="ts">
	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import AccommodationReservationRulesPreview from '@/features/accommodations/components/accommodation-reservation-rules/accommodation-reservation-rules-preview.svelte';
	import AccommodationBookingMode from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import AddAccommodationSaveButton from './add-accommodation-save-button.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import AccommodationPrice from '@/features/accommodations/components/accommodation-price/accommodation-price.svelte';
	import AccommodationCancellationPolicyPreview from '@/features/accommodations/components/accommodation-cancellation-policy/accommodation-cancellation-policy-preview/accommodation-cancellation-policy-preview.svelte';

	// UTILS
	import { calculateAccommodationPricing } from '@/shared/features/accommodations/utils/calculateAccommodationPricing.js';

	// SCHEMAS
	import {
		accommodationLocationSchema,
		createAccommodationSchema
	} from '@/shared/features/accommodations/schemas/accommodationSchemas.js';

	// CONFIG
	import { ACCOMMODATION_BILLING_PLANS } from '@/shared/features/accommodations/config.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';
	let { context }: { context: FormFieldContext<FormValue> } = $props();
	const form = getAccommodationFormContext();
	const address = $derived(accommodationLocationSchema.safeParse(context.values));
	const validation = $derived(
		createAccommodationSchema.safeParse({
			...context.values,
			imageKeys: form.state.files.map((file) => file.id)
		})
	);
	const validationErrors = $derived(
		validation.success
			? []
			: validation.error.issues
					.filter((issue) => issue.path[0] !== 'cancellationPolicy')
					.map((issue) => issue.message)
	);
	const flatFee = ACCOMMODATION_BILLING_PLANS.flat_fee;
</script>

<section
	class="flex flex-col gap-4"
	aria-label={m['AddAccommodationPage.AddAccommodationFormReview.preview']()}
>
	{#if form.state.files[0]}
		<img
			src={form.state.files[0].url}
			alt={String(context.values.name)}
			class="aspect-video w-full rounded-xl object-cover"
		/>
	{:else}
		<p class="rounded-xl bg-muted p-12 text-center text-muted-foreground">
			{m['AddAccommodationPage.AddAccommodationFormReview.noPhotos']()}
		</p>
	{/if}
	<AccommodationBookingMode
		mode={context.inputValue('bookingMode') === 'instant' ? 'instant' : 'request'}
	/>
	<h3 class="text-xl font-semibold">
		{String(context.values.name) || m['AddAccommodationPage.untitled']()}
	</h3>
	{#if validation.success}
		<p class="text-sm">
			<span class="text-muted-foreground">{m['PaymentsFeature.supported']()}:</span>
			{m[`PaymentsFeature.supportedOptions.${validation.data.supportedPaymentMethods}`]()}
		</p>
		<p>
			{m[`AddAccommodationPage.AddAccommodationFormReview.${validation.data.type}`]()}:
			{m[`AddAccommodationPage.AddAccommodationFormReview.${validation.data.spaceType}`]()}
		</p>
	{/if}
	<p class="text-muted-foreground">
		{address.success
			? [
					[address.data.address.street, address.data.address.streetNumber]
						.filter(Boolean)
						.join(' '),
					address.data.address.city,
					address.data.address.postalCode,
					address.data.address.country
				]
					.filter(Boolean)
					.join(', ')
			: ''}
	</p>

	<p>
		{m['AddAccommodationPage.AddAccommodationFormReview.capacity']({
			guests: Number(context.values.maxGuests),
			bedrooms: Number(context.values.bedrooms),
			beds: Number(context.values.beds),
			bathrooms: Number(context.values.bathrooms)
		})}
	</p>
	<p class="whitespace-pre-wrap">{String(context.values.description)}</p>
	<p class="text-lg font-semibold">
		{#if validation.success}<AccommodationPrice
				pricing={calculateAccommodationPricing(
					validation.data.nightlyPrice,
					validation.data.discountPercent,
					validation.data.weekendPrice
				)}
			/>{/if}
		<span class="text-sm font-normal text-muted-foreground">
			{m['AddAccommodationPage.AddAccommodationFormReview.night']()}
		</span>
	</p>
	{#if validation.success && validation.data.weekendPrice !== null}
		<p class="flex flex-wrap items-center gap-2 text-sm">
			<span>{m['AccommodationsFeature.Pricing.weekend']()}</span>
			<AccommodationPrice
				pricing={calculateAccommodationPricing(
					validation.data.weekendPrice,
					validation.data.discountPercent
				)}
			/>
		</p>
	{/if}

	<p>
		{m['AddAccommodationPage.AddAccommodationFormReview.smokingAllowed']()}:
		{context.checkboxValue('smokingAllowed')
			? m['AddAccommodationPage.AddAccommodationFormReview.yes']()
			: m['AddAccommodationPage.AddAccommodationFormReview.no']()}
	</p>
	<p>
		{m['AddAccommodationPage.AddAccommodationFormReview.petsAllowed']()}:
		{context.checkboxValue('petsAllowed')
			? m['AddAccommodationPage.AddAccommodationFormReview.yes']()
			: m['AddAccommodationPage.AddAccommodationFormReview.no']()}
	</p>
	<p>
		{m['AddAccommodationPage.AddAccommodationFormReview.partiesAllowed']()}:
		{context.checkboxValue('partiesAllowed')
			? m['AddAccommodationPage.AddAccommodationFormReview.yes']()
			: m['AddAccommodationPage.AddAccommodationFormReview.no']()}
	</p>
	<p class="text-sm whitespace-pre-wrap">{String(context.values.houseRules)}</p>
</section>
<div class="rounded-lg border p-4">
	<h3 class="font-medium">
		{m['AddAccommodationPage.AddAccommodationFormReview.billingTitle']()}
	</h3>
	{#if context.inputValue('billingPlanId') === 'flat_fee'}
		<p class="mt-2 text-sm">
			{m['AddAccommodationPage.AddAccommodationFormReview.flatFee']({
				amount: flatFee.amountMinor / 100,
				months: flatFee.intervalMonths
			})}
		</p>
		<p class="mt-1 text-sm text-muted-foreground">
			{m['AddAccommodationPage.AddAccommodationFormReview.flatFeeHint']()}
		</p>
	{:else if context.inputValue('billingPlanId') === 'booking_fee'}
		<p class="mt-2 text-sm">{m['AddAccommodationPage.AddAccommodationFormReview.bookingFee']()}</p>
		<p class="mt-1 text-sm text-muted-foreground">
			{m['AddAccommodationPage.AddAccommodationFormReview.bookingFeeHint']({
				percent: ACCOMMODATION_BILLING_PLANS.booking_fee.commissionBps / 100
			})}
		</p>
	{/if}
</div>
<p>
	{m['AddAccommodationPage.AddAccommodationFormReview.minimumStay']()}: {context.inputValue(
		'minimumStay'
	)}
</p>
<p>
	{m['AddAccommodationPage.AddAccommodationFormReview.maximumStay']()}: {context.inputValue(
		'maximumStay'
	) || m['AddAccommodationPage.AddAccommodationFormReview.unlimited']()}
</p>
<p>
	{m['AddAccommodationPage.AddAccommodationFormReview.checkInStart']()}: {context.inputValue(
		'checkInStart'
	)}
</p>
<p>
	{m['AddAccommodationPage.AddAccommodationFormReview.checkInEnd']()}: {context.inputValue(
		'checkInEnd'
	)}
</p>
<p>
	{m['AddAccommodationPage.AddAccommodationFormReview.checkOut']()}: {context.inputValue(
		'checkOut'
	)}
</p>
<p>
	{m['AddAccommodationPage.AddAccommodationFormReview.timeZone']()}: {context.inputValue(
		'timeZone'
	)}
</p>

<AccommodationReservationRulesPreview values={context.values} />

<AccommodationCancellationPolicyPreview
	policy={context.getValue('cancellationPolicy')}
	title={m['AddAccommodationPage.AddAccommodationFormReview.cancellationPolicy']()}
/>

<nav
	class="flex flex-wrap gap-2"
	aria-label={m['AddAccommodationPage.AddAccommodationFormReview.sections']()}
>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(0)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.basics']()}
	</Button>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(1)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.location']()}
	</Button>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(2)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.amenities']()}
	</Button>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(3)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.photos']()}
	</Button>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(4)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.pricing']()}
	</Button>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(5)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.rules']()}
	</Button>
	<Button type="button" variant="outline" disabled={context.disabled} onclick={() => form.goTo(6)}>
		{m['AddAccommodationPage.AddAccommodationFormReview.cancellationPolicy']()}
	</Button>
</nav>
{#if validationErrors.length}
	<Field.Error>{validationErrors.join(' ')}</Field.Error>
{/if}
<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}>
		{m['AddAccommodationPage.AddAccommodationFormReview.previous']()}
	</Button>
	<AddAccommodationSaveButton disabled={!validation.success} />
</div>
