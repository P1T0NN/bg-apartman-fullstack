import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
import { STORAGE_CONFIG } from '../shared/features/storage/config.js';
import { BOOKINGS_CONFIG } from '../shared/features/bookings/config.js';

const crons = cronJobs();

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
