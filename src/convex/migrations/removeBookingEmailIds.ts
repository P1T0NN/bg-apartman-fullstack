import { migrations } from './migrations.js';

/** Remove obsolete booking references while leaving queued email delivery and lifecycle intact. */
export const removeBookingEmailIds = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const hasEmailIds =
			'requestEmailIds' in booking ||
			'confirmationEmailId' in booking ||
			'hostConfirmationEmailId' in booking ||
			'expirationEmailId' in booking;
		if (!hasEmailIds) return;
		// Historical fields may already be absent from the application's tightened schema.
		const patch = {
			cancellation: booking.cancellation,
			requestEmailIds: undefined,
			confirmationEmailId: undefined,
			hostConfirmationEmailId: undefined,
			expirationEmailId: undefined
		};
		await ctx.db.patch('bookings', booking._id, patch);
	}
});
