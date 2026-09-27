// LIBRARIES
import { v } from 'convex/values';

// VALIDATORS
import { pageValidator } from '../../../validators/pageValidator.js';

const newsletterStatus = v.union(v.literal('subscribed'), v.literal('unsubscribed'));

export const newsletterResult = v.object({
	_id: v.id('newsletters'),
	_creationTime: v.number(),
	email: v.string(),
	status: newsletterStatus,
	subscribedAt: v.number(),
	unsubscribedAt: v.optional(v.number())
});

export const newsletterPage = pageValidator(newsletterResult);
