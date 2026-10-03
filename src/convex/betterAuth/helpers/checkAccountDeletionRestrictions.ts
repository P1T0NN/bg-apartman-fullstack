// TYPES
import type { QueryCtx } from '../../_generated/server.js';

/** Read inside the deletion transaction too, so concurrent bookings/listings cannot bypass it. */
export async function checkAccountDeletionRestrictions(
	ctx: Pick<QueryCtx, 'db'>,
	user: { id: string; email: string }
) {
	const email = user.email.trim().toLowerCase();

	for (const status of ['pending', 'confirmed'] as const) {
		const bookings = await Promise.all([
			ctx.db
				.query('bookings')
				.withIndex('by_host_id_status', (q) => q.eq('hostId', user.id).eq('status', status))
				.first(),
			ctx.db
				.query('bookings')
				.withIndex('by_owner_id_status', (q) => q.eq('ownerId', user.id).eq('status', status))
				.first(),
			ctx.db
				.query('bookings')
				.withIndex('by_email_status', (q) => q.eq('email', email).eq('status', status))
				.first()
		]);

		const hasUnresolvedBookings = bookings.some((booking) => booking !== null);

		if (hasUnresolvedBookings) return 'ACCOUNT_HAS_ACTIVE_BOOKINGS' as const;
	}

	const accommodation = await ctx.db
		.query('accommodations')
		.withIndex('by_owner_id', (q) => q.eq('ownerId', user.id))
		.first();

	if (accommodation) return 'ACCOUNT_HAS_ACCOMMODATIONS' as const;
	
	return null;
}
