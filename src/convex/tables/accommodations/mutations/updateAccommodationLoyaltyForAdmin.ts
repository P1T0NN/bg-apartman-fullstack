import { ConvexError, v } from 'convex/values';
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';
import { loyaltyServicesValidator } from '../../loyaltyMemberships/validators/loyaltyBenefitsValidators.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

export const updateAccommodationLoyaltyForAdmin = adminMutation({
	rateLimit: { name: 'accommodations:admin-update-loyalty' },
	args: {
		id: v.id('accommodations'),
		loyaltyEligible: v.boolean(),
		loyaltyServices: v.optional(loyaltyServicesValidator)
	},
	returns: v.null(),
	handler: async (ctx, { id, loyaltyEligible, loyaltyServices }) => {
		const accommodation = await ctx.db.get('accommodations', id);
		const isAvailableAccommodation = accommodation && accommodation.status !== 'deleted';
		if (!isAvailableAccommodation)
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		await ctx.db.patch('accommodations', id, {
			loyaltyEligible,
			loyaltyServices: loyaltyServices ?? accommodation.loyaltyServices,
			updatedAt: Date.now()
		});
		return null;
	}
});
