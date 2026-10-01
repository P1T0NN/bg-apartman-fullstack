// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalAction } from '../../../_generated/server.js';
import { internal } from '../../../_generated/api.js';

// EMAILS
import { sendBookingRecoveryEmail } from '../emails/sendBookingRecoveryEmail.js';

// DATA
import { EMAIL_DATA } from '../../../emails/data/emailData.js';

export const deliverBookingRecoveryLink = internalAction({
	args: { email: v.string(), locale: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		try {
			const recovery = await ctx.runAction(
				internal.tables.bookingRecoveryTokens.actions.issueBookingRecoveryToken
					.issueBookingRecoveryToken,
				{ email: args.email }
			);

			if (!recovery) return null;

			// Use the configured origin; callers cannot inject a redirect or email destination.
			const url = new URL('/find-booking', EMAIL_DATA.BRAND.URL);

			url.searchParams.set('token', recovery.token);

			await sendBookingRecoveryEmail({
				email: recovery.email,
				url: url.toString(),
				locale: args.locale
			});
		} catch {
			// Do not log provider exceptions, addresses, credentials or recovery URLs.
			console.error('Booking recovery email delivery failed');
		}

		return null;
	}
});
