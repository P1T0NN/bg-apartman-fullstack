// SCHEMAS
import { bookingRecoverySecretSchema } from '../../../../shared/features/bookingsRecoveryTokens/schemas/bookingRecoveryTokenSchemas.js';
// UTILS
import { hashSecret } from '../../../../shared/utils/secrets.js';
// TYPES
import type { QueryCtx } from '../../../_generated/server.js';

export async function getBookingRecoveryToken(ctx: QueryCtx, secret: string) {
	if (!bookingRecoverySecretSchema.safeParse(secret).success) return null;
	const tokenHash = await hashSecret(secret);
	const token = await ctx.db
		.query('bookingRecoveryTokens')
		.withIndex('by_token_hash', (q) => q.eq('tokenHash', tokenHash))
		.unique();
	const isValid = token && token.expiresAt > Date.now() && token.consumedAt === undefined;
	return isValid ? token : null;
}
