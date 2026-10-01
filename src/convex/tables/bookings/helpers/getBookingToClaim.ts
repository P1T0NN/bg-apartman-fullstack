// LIBRARIES
import { ConvexError } from 'convex/values';
// AUTH
import { authComponent } from '../../../betterAuth/config.js';
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';
// HELPERS
import { getBookingRecoveryToken } from '../../bookingRecoveryTokens/helpers/getBookingRecoveryToken.js';
// SCHEMAS
import { bookingEmailSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';
// TYPES
import type { UserIdentity } from 'convex/server';
import type { QueryCtx } from '../../../_generated/server.js';
import type { Id } from '../../../_generated/dataModel.js';
import type { BackendErrorData } from '../../../../shared/types/types.js';

export async function getBookingToClaim(
	ctx: QueryCtx & { identity: UserIdentity },
	bookingId: Id<'bookings'>,
	secret: string
) {
	const token = await getBookingRecoveryToken(ctx, secret);
	if (!token) throw new ConvexError<BackendErrorData>({ code: 'INVALID_BOOKING_RECOVERY_TOKEN' });
	const booking = await ctx.db.get('bookings', bookingId);
	if (!booking || booking.email !== token.email)
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_NOT_FOUND' });
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user) throw new ConvexError<BackendErrorData>({ code: 'UNAUTHENTICATED' });
	if (!user.emailVerified)
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_EMAIL_UNVERIFIED' });
	if (bookingEmailSchema.parse(user.email) !== token.email)
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_EMAIL_MISMATCH' });
	const ownerId = getOwnerId(ctx.identity);
	const hasConflictingOwner = booking.ownerId !== undefined && booking.ownerId !== ownerId;
	if (hasConflictingOwner)
		throw new ConvexError<BackendErrorData>({ code: 'BOOKING_ALREADY_CLAIMED' });
	return { booking, ownerId };
}
