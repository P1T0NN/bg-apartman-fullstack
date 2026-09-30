// UTILS
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { Snippet } from 'svelte';
import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';
import type {
	CustomFieldContext,
	FieldConfig
} from '@/components/ui/custom-components/form/formTypes.js';

/** Booking checkout fields. Translation keys stay under the BookingPage page namespace. */
export function createBookingFormFields(input: {
	accommodation: Pick<PublicAccommodation, 'maxGuests'>;
	guests: { adults: number; children: number };
	render: {
		tripHeading: Snippet<[CustomFieldContext]>;
		stayDates: Snippet<[CustomFieldContext]>;
		tripLimits: Snippet<[CustomFieldContext]>;
		guestHeading: Snippet<[CustomFieldContext]>;
	};
}): FieldConfig[] {
	const { accommodation, guests, render } = input;

	return [
		{ kind: 'custom', name: 'tripHeading', render: render.tripHeading },
		{ kind: 'custom', name: 'stayDates', render: render.stayDates },
		{
			kind: 'counter',
			name: 'adults',
			label: m['BookingPage.BookingCheckout.adults'](),
			min: 1,
			max: accommodation.maxGuests - guests.children
		},
		{
			kind: 'counter',
			name: 'children',
			label: m['BookingPage.BookingCheckout.children'](),
			min: 0,
			max: accommodation.maxGuests - guests.adults
		},
		{ kind: 'custom', name: 'tripLimits', render: render.tripLimits },
		{
			kind: 'custom',
			name: 'guestHeading',
			render: render.guestHeading,
			class: 'border-t pt-8'
		},
		{
			kind: 'input',
			name: 'firstName',
			label: m['BookingPage.BookingCheckout.firstName'](),
			placeholder: m['BookingPage.BookingCheckout.firstNamePlaceholder'](),
			required: true,
			maxLength: 100,
			autocomplete: 'given-name'
		},
		{
			kind: 'input',
			name: 'lastName',
			label: m['BookingPage.BookingCheckout.lastName'](),
			placeholder: m['BookingPage.BookingCheckout.lastNamePlaceholder'](),
			required: true,
			maxLength: 100,
			autocomplete: 'family-name'
		},
		{
			kind: 'input',
			name: 'email',
			type: 'email',
			inputmode: 'email',
			label: m['BookingPage.BookingCheckout.email'](),
			placeholder: m['BookingPage.BookingCheckout.emailPlaceholder'](),
			description: m['BookingPage.BookingCheckout.emailHint'](),
			required: true,
			maxLength: 254,
			autocomplete: 'email'
		},
		{
			kind: 'input',
			name: 'phone',
			type: 'tel',
			inputmode: 'tel',
			label: m['BookingPage.BookingCheckout.phone'](),
			placeholder: m['BookingPage.BookingCheckout.phonePlaceholder'](),
			description: m['BookingPage.BookingCheckout.phoneHint'](),
			required: true,
			maxLength: 40,
			autocomplete: 'tel'
		},
		{
			kind: 'textarea',
			name: 'specialRequests',
			label: m['BookingPage.BookingCheckout.requestsLabel'](),
			description: m['BookingPage.BookingCheckout.requestsHint'](),
			rows: 3
		}
	];
}
