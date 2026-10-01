// MIGRATIONS
import { migrations } from './migrations.js';

/** Resumable, idempotent backfill; ownership, lifecycle and aggregate keys stay unchanged. */
export const backfillBookingEmails = migrations.define({
	table: 'bookings',
	migrateOne: async (_ctx, booking) => {
		const email = booking.email.trim().toLowerCase();
		const searchText = `${booking.lastName} ${email}`.toLowerCase();
		const isNormalized = email === booking.email && searchText === booking.searchText;
		return isNormalized ? undefined : { email, searchText };
	}
});
