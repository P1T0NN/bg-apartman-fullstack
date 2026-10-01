// LIBRARIES
import { docValidator } from 'convex/server';

// SCHEMAS
import { bookingRecoveryTokens } from '../schema.js';

export const recoveryAccess = docValidator('bookingRecoveryTokens', bookingRecoveryTokens).pick(
	'email',
	'expiresAt'
);
