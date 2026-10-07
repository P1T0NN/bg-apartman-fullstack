// LIBRARIES
import { ConvexError, v } from 'convex/values';

// BUILDERS
import { authenticatedMutation } from '../../../builders/convexFunctionBuilders.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// CONVEX
import { internal } from '../../../_generated/api.js';

// CONFIG
import { ACCOMMODATION_PAYMENT_SIMULATION } from '../../../../shared/features/accommodations/config.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Development simulation only. Real payments must be granted by a verified webhook. */
export const payFlatFeeAccommodation = authenticatedMutation({
	rateLimit: { name: 'accommodations:pay-flat-fee' },
	args: { id: v.id('accommodations') },
	returns: v.null(),
	handler: async (ctx, { id }) => {
		if (!ACCOMMODATION_PAYMENT_SIMULATION)
			throw new ConvexError<BackendErrorData>({
				code: 'ACCOMMODATION_PAYMENT_SIMULATION_DISABLED'
			});

		const accommodation = await ctx.db.get('accommodations', id);

		if (!accommodation || accommodation.ownerId !== getOwnerId(ctx.identity))
			throw new ConvexError<BackendErrorData>({ code: 'FORBIDDEN' });

		if (accommodation.status === 'deleted')
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });

		if (
			accommodation.billingPlanId !== 'flat_fee' ||
			accommodation.billingTerms.model !== 'flat_fee'
		)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_BILLING_PLAN_CHANGED' });

		const now = Date.now();

		const isAlreadyPaid =
			accommodation.billingStatus === 'active' &&
			accommodation.billingPeriodEndsAt !== null &&
			accommodation.billingPeriodEndsAt > now;

		if (isAlreadyPaid) return null;

		const months = accommodation.billingTerms.intervalMonths;

		if (!Number.isSafeInteger(months) || months <= 0)
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		// UTC calendar months, clamped to the last day of the target month.
		const end = new Date(now);
		const day = end.getUTCDate();
		end.setUTCDate(1);
		end.setUTCMonth(end.getUTCMonth() + months);
		const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
		end.setUTCDate(Math.min(day, lastDay));
		const billingPeriodEndsAt = end.getTime();

		if (!Number.isFinite(billingPeriodEndsAt))
			throw new ConvexError<BackendErrorData>({ code: 'INVALID_ACCOMMODATION' });

		await ctx.db.patch('accommodations', id, {
			billingStatus: 'active',
			billingPeriodEndsAt,
			updatedAt: now
		});

		await ctx.scheduler.runAt(
			billingPeriodEndsAt,
			internal.tables.accommodations.mutations.expireFlatFeeAccommodation
				.expireFlatFeeAccommodation,
			{ id, billingPeriodEndsAt }
		);

		return null;
	}
});
