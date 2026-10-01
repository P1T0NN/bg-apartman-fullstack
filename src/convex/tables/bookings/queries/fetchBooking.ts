// LIBRARIES
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { query } from '../../../_generated/server.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { getOwnerId, requireIdentity } from '../../../betterAuth/helpers/requireIdentity.js';
import { getBookingRecoveryToken } from '../../bookingRecoveryTokens/helpers/getBookingRecoveryToken.js';
import { getBookingGuestDetails } from '../helpers/getBookingGuestDetails.js';

// VALIDATORS
import { recoveredBookingPage } from '../validators/bookingValidators.js';

/** The expiry cron deletes tokens to invalidate subscribed results as time passes. */
export const fetchBooking = query({
	args: {
		token: v.optional(v.string()),
		paginationOpts: paginationOptsValidator
	},
	returns: v.union(recoveredBookingPage, v.null()),
	handler: async (ctx, args) => {
		let source;

		if (args.token !== undefined) {
			const token = await getBookingRecoveryToken(ctx, args.token);
			if (!token) return null;

			source = ctx.db
				.query('bookings')
				.withIndex('by_email_check_out_date', (q) => q.eq('email', token.email))
				.order('desc');
		} else {
			const ownerId = getOwnerId(await requireIdentity(ctx));

			source = ctx.db
				.query('bookings')
				.withIndex('by_owner_id', (q) => q.eq('ownerId', ownerId))
				.order('desc');
		}

		const page = await getPagination(source, {
			paginationOpts: {
				...args.paginationOpts,
				numItems: Math.min(20, Math.max(1, args.paginationOpts.numItems)),
				maximumRowsRead: Math.min(args.paginationOpts.maximumRowsRead ?? 40, 40),
				maximumBytesRead: Math.min(args.paginationOpts.maximumBytesRead ?? 131072, 131072)
			}
		});

		const items = await Promise.all(
			page.items.map((booking) => getBookingGuestDetails(ctx, booking))
		);

		return { ...page, items };
	}
});
