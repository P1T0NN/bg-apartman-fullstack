import { expect, test } from 'vitest';
import { createBookingSchema } from '../src/shared/features/bookings/schemas/bookingSchemas.js';

test('booking validation enforces combined guest capacity as listing limits change', () => {
	const limits = { today: '2026-10-05', minimumStay: 1, maxGuests: 2 };
	const values = {
		accommodationId: 'accommodation-id',
		checkInDate: '2026-10-16',
		checkOutDate: '2026-10-17',
		firstName: 'Alex',
		lastName: 'Guest',
		email: 'alex@example.com',
		phone: '+381 64 1234567'
	};
	const parse = (adults: number, children: number) =>
		createBookingSchema(limits).safeParse({ ...values, adults, children });

	expect(parse(2, 0).success).toBe(true);
	expect(parse(1, 1).success).toBe(true);
	const overCapacity = parse(2, 1);
	expect(overCapacity.success).toBe(false);
	if (!overCapacity.success) {
		expect(overCapacity.error.issues).toEqual(
			expect.arrayContaining([expect.objectContaining({ path: ['adults'] })])
		);
	}
	expect(parse(0, 1).success).toBe(false);
	limits.maxGuests = 1;
	expect(parse(1, 0).success).toBe(true);
	expect(parse(1, 1).success).toBe(false);
});
