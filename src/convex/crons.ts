import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { STORAGE_CONFIG } from '../shared/features/storage/config.js';
import { BOOKINGS_CONFIG } from '../shared/features/bookings/config.js';
import { PAYMENTS_CONFIG } from '../shared/features/payments/config.js';

const crons = cronJobs();

crons.interval(
	'reconcile Checkout.com listing fees',
	{ seconds: PAYMENTS_CONFIG.reconcileIntervalMs / 1000 },
	internal.checkout.crons.maintainFeePayments.maintainFeePayments
);

crons.interval(
	'complete finished stays and award loyalty credit',
	{ minutes: 1 },
	internal.tables.bookings.crons.completeBookingsCron.completeBookingsCron
);

crons.interval(
	'expire unanswered booking requests',
	{ minutes: BOOKINGS_CONFIG.REQUEST_EXPIRATION_INTERVAL_MINUTES },
	internal.tables.bookings.crons.expireBookingRequestsCron.expireBookingRequestsCron
);

crons.interval(
	'clean up abandoned R2 uploads',
	{ minutes: STORAGE_CONFIG.cleanupIntervalMinutes },
	internal.storage.actions.cleanupStaleUploads
);

crons.interval(
	'clean up expired audit logs',
	{ hours: 24 },
	internal.auditLogs.mutations.cleanupAuditLogs.cleanupAuditLogs
);

crons.interval(
	'clean up expired booking recovery tokens',
	{ minutes: BOOKINGS_CONFIG.RECOVERY_TOKEN_CLEANUP_INTERVAL_MINUTES },
	internal.tables.bookingRecoveryTokens.crons.cleanupExpiredBookingRecoveryTokensCron
		.cleanupExpiredBookingRecoveryTokensCron
);

export default crons;
