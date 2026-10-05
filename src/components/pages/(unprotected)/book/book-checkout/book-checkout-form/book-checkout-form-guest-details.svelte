<script lang="ts">
	// COMPONENTS
	import { Input } from '@/components/ui/input/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import * as Field from '@/components/ui/field/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { BookingCheckoutValues } from '@/shared/features/bookings/types/bookingTypes.js';

	let {
		values,
		errors,
		submitting
	}: {
		values: BookingCheckoutValues;
		errors: Record<string, string>;
		submitting: boolean;
	} = $props();

	const id = $props.id();
</script>

<Field.Field data-invalid={Boolean(errors.firstName)}>
	<Field.Label for={`${id}-firstName`}>
		{m['BookingPage.BookingCheckout.firstName']()}
		<span class="text-destructive">*</span>
	</Field.Label>

	<Input
		id={`${id}-firstName`}
		name="firstName"
		type="text"
		autocomplete="given-name"
		required
		maxlength={100}
		placeholder={m['BookingPage.BookingCheckout.firstNamePlaceholder']()}
		bind:value={values.firstName}
		disabled={submitting}
		oninput={() => {
			errors.firstName = '';
		}}
		aria-invalid={Boolean(errors.firstName)}
		aria-describedby={errors.firstName ? `${id}-firstName-error` : undefined}
	/>
	{#if errors.firstName}
		<Field.Error id={`${id}-firstName-error`}>
			{errors.firstName}
		</Field.Error>
	{/if}
</Field.Field>

<Field.Field data-invalid={Boolean(errors.lastName)}>
	<Field.Label for={`${id}-lastName`}>
		{m['BookingPage.BookingCheckout.lastName']()}
		<span class="text-destructive">*</span>
	</Field.Label>

	<Input
		id={`${id}-lastName`}
		name="lastName"
		type="text"
		autocomplete="family-name"
		required
		maxlength={100}
		placeholder={m['BookingPage.BookingCheckout.lastNamePlaceholder']()}
		bind:value={values.lastName}
		disabled={submitting}
		oninput={() => {
			errors.lastName = '';
		}}
		aria-invalid={Boolean(errors.lastName)}
		aria-describedby={errors.lastName ? `${id}-lastName-error` : undefined}
	/>
	{#if errors.lastName}
		<Field.Error id={`${id}-lastName-error`}>
			{errors.lastName}
		</Field.Error>
	{/if}
</Field.Field>

<Field.Field data-invalid={Boolean(errors.email)}>
	<Field.Label for={`${id}-email`}>
		{m['BookingPage.BookingCheckout.email']()}
		<span class="text-destructive">*</span>
	</Field.Label>
	<Field.Description id={`${id}-email-hint`}>
		{m['BookingPage.BookingCheckout.emailHint']()}
	</Field.Description>
	<Input
		id={`${id}-email`}
		name="email"
		type="email"
		autocomplete="email"
		required
		maxlength={254}
		placeholder={m['BookingPage.BookingCheckout.emailPlaceholder']()}
		bind:value={values.email}
		disabled={submitting}
		oninput={() => {
			errors.email = '';
		}}
		aria-invalid={Boolean(errors.email)}
		aria-describedby={`${id}-email-hint ${errors.email ? `${id}-email-error` : ''}`}
	/>
	{#if errors.email}
		<Field.Error id={`${id}-email-error`}>{errors.email}</Field.Error>
	{/if}
</Field.Field>

<Field.Field data-invalid={Boolean(errors.phone)}>
	<Field.Label for={`${id}-phone`}>
		{m['BookingPage.BookingCheckout.phone']()}
		<span class="text-destructive">*</span>
	</Field.Label>
	<Field.Description id={`${id}-phone-hint`}>
		{m['BookingPage.BookingCheckout.phoneHint']()}
	</Field.Description>
	<Input
		id={`${id}-phone`}
		name="phone"
		type="tel"
		autocomplete="tel"
		required
		maxlength={40}
		placeholder={m['BookingPage.BookingCheckout.phonePlaceholder']()}
		bind:value={values.phone}
		disabled={submitting}
		oninput={() => {
			errors.phone = '';
		}}
		aria-invalid={Boolean(errors.phone)}
		aria-describedby={`${id}-phone-hint ${errors.phone ? `${id}-phone-error` : ''}`}
	/>
	{#if errors.phone}
		<Field.Error id={`${id}-phone-error`}>{errors.phone}</Field.Error>
	{/if}
</Field.Field>

<Field.Field data-invalid={Boolean(errors.specialRequests)}>
	<Field.Label for={`${id}-specialRequests`}>
		{m['BookingPage.BookingCheckout.requestsLabel']()}
	</Field.Label>
	<Field.Description id={`${id}-specialRequests-hint`}>
		{m['BookingPage.BookingCheckout.requestsHint']()}
	</Field.Description>
	<Textarea
		id={`${id}-specialRequests`}
		name="specialRequests"
		bind:value={values.specialRequests}
		rows={3}
		maxlength={1000}
		placeholder={m['BookingPage.BookingCheckout.requestsPlaceholder']()}
		disabled={submitting}
		oninput={() => {
			errors.specialRequests = '';
		}}
		aria-invalid={Boolean(errors.specialRequests)}
		aria-describedby={`${id}-specialRequests-hint ${errors.specialRequests ? `${id}-specialRequests-error` : ''}`}
	/>
	{#if errors.specialRequests}
		<Field.Error id={`${id}-specialRequests-error`}>
			{errors.specialRequests}
		</Field.Error>
	{/if}
</Field.Field>
