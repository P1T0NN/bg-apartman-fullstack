import { expect, test } from 'vitest';
import { createBookingFormFields } from '../src/features/bookings/forms/createBookingForm.js';
import { createRawSnippet } from 'svelte';
import { overwriteGetLocale } from '../src/lib/paraglide/runtime.js';

test('booking counters share the accommodation capacity as adults and children change', () => {
	overwriteGetLocale(() => 'en');
	const render = createRawSnippet(() => ({ render: () => '<span></span>' }));
	const accommodation = { maxGuests: 2 };
	const fields = (adults: number, children: number) =>
		createBookingFormFields({
			accommodation,
			guests: { adults, children },
			render: { tripHeading: render, stayDates: render, tripLimits: render, guestHeading: render }
		}).filter((field) => field.kind === 'counter');

	expect(fields(2, 0).map((field) => field.max)).toEqual([2, 0]);
	expect(fields(1, 0).map((field) => field.max)).toEqual([2, 1]);
	expect(fields(1, 1).map((field) => field.max)).toEqual([1, 1]);
	accommodation.maxGuests = 1;
	expect(fields(1, 0).map((field) => field.max)).toEqual([1, 0]);
});
