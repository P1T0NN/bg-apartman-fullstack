import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { STORAGE_CONFIG } from '../shared/features/storage/config.js';
import { BOOKINGS_CONFIG } from '../shared/features/bookings/config.js';
import { STRIPE_CONFIG } from '../shared/features/stripe/config.js';

const crons = cronJobs();

crons.interval(
	'complete finished stays and award loyalty credit',
	{ minutes: 1 },
	internal.tables.bookings.crons.completeBookingsCron.completeBookingsCron
);

crons.interval(
	'reconcile and clean up listing fee payments',
	{ minutes: STRIPE_CONFIG.maintenanceIntervalMinutes },
	internal.tables.accommodationFeePayments.crons.maintainFeePaymentsCron.maintainFeePaymentsCron
);
crons.interval(
	'clean up Stripe event receipts',
	{ minutes: STRIPE_CONFIG.maintenanceIntervalMinutes },
	internal.tables.stripeWebhookEvents.crons.cleanupStripeWebhookEventsCron
		.cleanupStripeWebhookEventsCron
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
