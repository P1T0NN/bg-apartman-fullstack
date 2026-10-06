import { expect, test } from 'vitest';
import { createBookingSchema } from '../src/shared/features/bookings/schemas/bookingSchemas.js';

const limits = { today: '2026-09-27', minimumStay: 2, maximumStay: 30, maxGuests: 4 };
const stay = {
	paymentMethod: 'cash' as const,
	expectedPricePerNightMinor: 8025,
	expectedTotalMinor: 24075,
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

test('arrival-today preview enforces overnight stays and the exact local cutoff', () => {
	const today = '2027-01-01';
	const rules = {
		...limits,
		today,
		sameDayReservation: true,
		checkInStart: '14:00',
		timeZone: 'Europe/Belgrade',
		now: Date.parse('2027-01-01T12:59:59Z')
	};
	const request = { ...stay, checkInDate: today, checkOutDate: '2027-01-04' };
	expect(createBookingSchema(rules).safeParse(request).success).toBe(true);
	expect(createBookingSchema(rules).safeParse({ ...request, checkOutDate: today }).success).toBe(
		false
	);
	expect(
		createBookingSchema({ ...rules, sameDayReservation: false }).safeParse(request).success
	).toBe(false);
	expect(
		createBookingSchema({ ...rules, now: Date.parse('2027-01-01T13:00:00Z') }).safeParse(request)
			.success
	).toBe(false);
});

test('booking payment method is mandatory and rejects unsupported values', () => {
	for (const paymentMethod of [undefined, '', 'both', 'bank_transfer']) {
		expect(createBookingSchema(limits).safeParse({ ...stay, paymentMethod }).success).toBe(false);
	}
	for (const paymentMethod of ['cash', 'online']) {
		expect(createBookingSchema(limits).safeParse({ ...stay, paymentMethod }).success).toBe(true);
	}
});
