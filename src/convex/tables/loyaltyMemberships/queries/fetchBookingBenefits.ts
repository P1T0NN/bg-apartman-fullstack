import { v } from 'convex/values';
import { query } from '../../../_generated/server.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';
import { getBookingBenefitsContext } from '../helpers/getBookingBenefitsContext.js';
import { bookingBenefitsContextValidator } from '../validators/loyaltyBenefitsValidators.js';
import { isAccommodationPublic } from '../../accommodations/helpers/isAccommodationPublic.js';

export const fetchBookingBenefits = query({
	args: { accommodationId: v.id('accommodations') },
	returns: v.union(bookingBenefitsContextValidator, v.null()),
	handler: async (ctx, args) => {
		const accommodation = await ctx.db.get('accommodations', args.accommodationId);
		if (!accommodation || !(await isAccommodationPublic(ctx, accommodation))) return null;
		const identity = await ctx.auth.getUserIdentity();
		return getBookingBenefitsContext(
			ctx,
			accommodation,
			identity ? getOwnerId(identity) : undefined
		);
	}
});
