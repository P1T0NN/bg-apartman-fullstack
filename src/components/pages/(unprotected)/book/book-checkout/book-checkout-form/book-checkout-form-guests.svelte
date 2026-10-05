<script lang="ts">
	// COMPONENTS
	import Counter from '@/components/ui/custom-components/counter/counter.svelte';
	import * as Field from '@/components/ui/field/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { BookingCheckoutValues } from '@/shared/features/bookings/types/bookingTypes.js';

	let {
		accommodation,
		values,
		errors,
		submitting
	}: {
		accommodation: PublicAccommodation;
		values: BookingCheckoutValues;
		errors: Record<string, string>;
		submitting: boolean;
	} = $props();

	const id = $props.id();
</script>

<div
	tabindex="-1"
	aria-invalid={Boolean(errors.adults)}
	aria-describedby={errors.adults ? `${id}-adults-error` : undefined}
>
	<Counter
		label={m['BookingPage.BookingCheckout.adults']()}
		bind:value={
			() => values.adults,
			(value) => {
				values.adults = value;
				errors.adults = '';
				errors.children = '';
			}
		}
		min={1}
		max={accommodation.maxGuests - values.children}
		disabled={submitting}
	/>
	{#if errors.adults}
		<Field.Error id={`${id}-adults-error`}>{errors.adults}</Field.Error>
	{/if}
</div>

<div
	tabindex="-1"
	aria-invalid={Boolean(errors.children)}
	aria-describedby={errors.children ? `${id}-children-error` : undefined}
>
	<Counter
		label={m['BookingPage.BookingCheckout.children']()}
		bind:value={
			() => values.children,
			(value) => {
				values.children = value;
				errors.adults = '';
				errors.children = '';
			}
		}
		min={0}
		max={accommodation.maxGuests - values.adults}
		disabled={submitting}
	/>

	{#if errors.children}
		<Field.Error id={`${id}-children-error`}>
			{errors.children}
		</Field.Error>
	{/if}
</div>
