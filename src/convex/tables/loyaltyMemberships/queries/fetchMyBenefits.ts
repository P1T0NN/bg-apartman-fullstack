// BUILDERS
import { authenticatedQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getLoyaltyMembership } from '../helpers/getLoyaltyMembership.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// VALIDATORS
import { myBenefitsValidator } from '../validators/loyaltyMembershipValidators.js';

export const fetchMyBenefits = authenticatedQuery({
	args: {},
	returns: myBenefitsValidator,
	handler: async (ctx) => {
		const membership = await getLoyaltyMembership(ctx, getOwnerId(ctx.identity));

		const qualifyingStays = membership?.qualifyingStays ?? 0;
		const joinedAt = membership?.joinedAt ?? null;

		return {
			level: membership?.level ?? 0,
			qualifyingStays,
			joinedAt
		};
	}
});
