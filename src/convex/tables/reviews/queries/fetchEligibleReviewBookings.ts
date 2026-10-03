import { ConvexError, v } from 'convex/values';
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';
import { getReviewPage } from '../helpers/getReviewPage.js';
import { REVIEWS_CONFIG } from '../../../../shared/features/reviews/config.js';
import { DAY_IN_MS } from '../../../../shared/utils/date.js';
import { canReviewBooking } from '../../../../shared/features/reviews/utils/canReviewBooking.js';
import { setEmptyPagination } from '../../../../shared/features/pagination/utils/setEmptyPagination.js';
import { listPageArgs } from '../../../validators/listPageArgs.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const fetchEligibleReviewBookings = authenticatedQuery({
	// The browser clock triggers refreshes; eligibility always uses the server clock.
	args: { ...listPageArgs, accommodationId: v.id('accommodations'), now: v.number() },
	returns: v.object({
		items: v.array(
			v.object({
				_id: v.id('bookings'),
				checkInDate: v.string(),
				checkOutDate: v.string(),
				timeZone: v.string()
			})
		),
		nextCursor: v.union(v.string(), v.null()),
		hasNextPage: v.boolean(),
		pageSize: v.number()
	}),
	handler: async (ctx, args) => {
		if (!Number.isFinite(args.now))
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_REVIEW' });
		const ownerId = getOwnerId(ctx.identity);
		const accommodation = await ctx.db.get('accommodations', args.accommodationId);
		const isUnavailable =
			!accommodation || accommodation.status !== 'published' || accommodation.ownerId === ownerId;
		if (isUnavailable) return setEmptyPagination(args.paginationOpts.numItems);
		const now = Date.now();
		// One extra day covers property-local midnight and daylight-saving changes.
		const oldest = now - (REVIEWS_CONFIG.REVIEW_WINDOW_DAYS + 1) * DAY_IN_MS;
		const page = await getReviewPage(
			ctx.db
				.query('bookings')
				.withIndex('by_owner_id_accommodation_id_status_review_id_check_out_at', (q) =>
					q
						.eq('ownerId', ownerId)
						.eq('accommodationId', args.accommodationId)
						.eq('status', 'completed')
						.eq('reviewId', undefined)
						.gt('cancellationTerms.checkOutAt', oldest)
						.lte('cancellationTerms.checkOutAt', now)
				)
				.order('desc'),
			args.paginationOpts
		);
		return {
			...page,
			items: page.items
				.filter((booking) => canReviewBooking(booking, now))
				.map(({ _id, checkInDate, checkOutDate, cancellationTerms }) => ({
					_id,
					checkInDate,
					checkOutDate,
					timeZone: cancellationTerms.timeZone
				}))
		};
	}
});
