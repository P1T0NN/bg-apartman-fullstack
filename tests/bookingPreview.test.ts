import { expect, test } from 'vitest';
import { createBookingSchema } from '../src/shared/features/bookings/schemas/bookingSchemas.js';

const limits = { today: '2026-09-27', minimumStay: 2, maximumStay: 30, maxGuests: 4 };
const stay = {
	accommodationId: 'accommodation-id',
	checkInDate: '2026-10-24',
	checkOutDate: '2026-10-27',
	adults: 2,
	children: 1,
	firstName: 'Alex',
	lastName: 'Guest',
	email: 'alex@example.com',
	phone: '+381 64 1234567',
	specialRequests: ''
};

function parseStay(overrides: Partial<typeof stay> = {}) {
	return createBookingSchema(limits).safeParse({ ...stay, ...overrides });
}

function stayIssueCode(overrides: Partial<typeof stay> = {}) {
	const result = parseStay(overrides);
	if (result.success) return undefined;
	const [issue] = result.error.issues;
	return issue.code === 'custom' ? issue.params?.code : issue.code;
}

test('createBookingSchema accepts a valid stay and rejects invalid dates, guests and stay lengths', () => {
	expect(parseStay().success).toBe(true);
	expect(parseStay({ checkInDate: '2026-02-30' }).success).toBe(false);
	expect(parseStay({ checkInDate: '' }).success).toBe(false);
	expect(stayIssueCode({ checkInDate: '2026-09-26' })).toBe('PAST_STAY_DATE');
	expect(stayIssueCode({ checkOutDate: stay.checkInDate })).toBe('STAY_DATE_ORDER');
	expect(stayIssueCode({ checkOutDate: '2026-10-25' })).toBe('STAY_BELOW_MINIMUM');
	expect(stayIssueCode({ checkOutDate: '2026-12-01' })).toBe('STAY_ABOVE_MAXIMUM');
	expect(stayIssueCode({ children: 3 })).toBe('STAY_GUEST_LIMIT');
	expect(parseStay({ adults: 0 }).success).toBe(false);
	expect(parseStay({ adults: 1.5 }).success).toBe(false);
	expect(parseStay({ adults: Number.NaN }).success).toBe(false);
});

test('createBookingSchema trims guest details, coerces counts and requires a valid stay', () => {
	const schema = createBookingSchema(limits);

	expect(
		schema.safeParse({
			...stay,
			adults: '2',
			children: '0',
			firstName: ' ',
			email: 'bad',
			phone: ''
		}).success
	).toBe(false);

	expect(schema.safeParse({ ...stay, checkInDate: 'not-a-date' }).success).toBe(false);

	const parsed = schema.parse({
		...stay,
		adults: '2',
		children: '1',
		firstName: ' Alex ',
		email: 'alex@example.com',
		phone: '+381 64 1234567'
	});
	expect(parsed.firstName).toBe('Alex');
	expect(parsed.adults).toBe(2);
	expect(parsed.children).toBe(1);
	expect(parsed.specialRequests).toBeUndefined();
});
