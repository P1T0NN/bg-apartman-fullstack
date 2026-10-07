// LIBRARIES
import { docValidator } from 'convex/server';
import { v } from 'convex/values';

// CONVEX
import { query } from '../../../_generated/server.js';

// SCHEMAS
import { accommodations } from '../schema.js';

// STORAGE
import { resolveStoredFileUrls } from '../../../storage/r2.js';

// HELPERS
import { getAccommodationReviewSummary } from '../../reviews/helpers/getAccommodationReviewSummary.js';
import { getAccommodationCalendar } from '../../accommodationBlockedDates/helpers/getAccommodationCalendar.js';

// VALIDATORS
import { reviewSummary } from '../../reviews/validators/reviewValidators.js';
import { calendarResult } from '../../accommodationBlockedDates/validators/accommodationBlockedDatesValidators.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { PublicAccommodation } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

export const fetchPublicAccommodation = query({
	args: {
		id: v.id('accommodations')
	},
	returns: v.union(
		docValidator('accommodations', accommodations)
			.omit(
				'ownerId',
				'billingPlanId',
				'billingTerms',
				'billingStatus',
				'billingPeriodEndsAt',
				'imageKeys',
				'recommendationSortKey',
				'guestRatingAverage',
				'guestReviewCount'
			)
			.extend({
				imageUrls: v.array(v.string()),
				reviews: reviewSummary,
				availability: calendarResult
			}),
		v.null()
	),
	handler: async (ctx, { id }) => {
		const accommodation = await ctx.db.get('accommodations', id);

		if (!isAccommodationVisible(accommodation)) return null;

		const {
			ownerId: _ownerId,
			billingPlanId: _billingPlanId,
			billingTerms: _billingTerms,
			billingStatus: _billingStatus,
			billingPeriodEndsAt: _billingPeriodEndsAt,
			recommendationSortKey: _recommendationSortKey,
			guestRatingAverage: _guestRatingAverage,
			guestReviewCount: _guestReviewCount,
			imageKeys,
			...details
		} = accommodation;

		const [imageUrls, summary, availability] = await Promise.all([
			resolveStoredFileUrls(imageKeys),
			getAccommodationReviewSummary(ctx, id),
			getAccommodationCalendar(ctx, accommodation)
		]);

		const publicAccommodation: PublicAccommodation = {
			...details,
			imageUrls,
			reviews: summary,
			availability
		};

		return publicAccommodation;
	}
});
