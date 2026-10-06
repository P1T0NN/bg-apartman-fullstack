import { migrations } from './migrations.js';

/** Default legacy listings to cash without changing an existing host selection. */
export const backfillAccommodationPaymentMethods = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (accommodation.supportedPaymentMethods !== undefined) return;
		await ctx.db.patch('accommodations', accommodation._id, { supportedPaymentMethods: 'cash' });
	}
});

/** Cash is the chosen migration default, not evidence of a historical payment. */
export const backfillBookingPaymentMethods = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		if (booking.paymentMethod !== undefined) return;
		await ctx.db.patch('bookings', booking._id, { paymentMethod: 'cash' });
	}
});
