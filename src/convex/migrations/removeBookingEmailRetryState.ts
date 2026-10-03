import { migrations } from './migrations.js';

/** Retire the previous queue's operational state without resending historical receipts. */
export const removeBookingEmailRetryState = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const hasObsoleteState =
			'requestNotifications' in booking ||
			(booking.cancellation !== undefined && 'notifications' in booking.cancellation);
		if (!hasObsoleteState) return;
		const patch = {
			requestNotifications: undefined,
			cancellation: booking.cancellation
				? { ...booking.cancellation, notifications: undefined }
				: undefined
		};
		await ctx.db.patch('bookings', booking._id, patch);
	}
});
