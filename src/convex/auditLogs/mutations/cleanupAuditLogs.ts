// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internal } from '../../_generated/api.js';
import { internalMutation } from '../../builders/convexFunctionBuilders.js';

// CONFIG
import {
	AUDIT_LOG_CLEANUP_BATCH_SIZE,
	AUDIT_LOG_RETENTION_DAYS,
	auditLog
} from '../auditLogs.config.js';

export const cleanupAuditLogs = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const deleted = await auditLog.cleanup(ctx, {
			olderThanDays: AUDIT_LOG_RETENTION_DAYS,
			batchSize: AUDIT_LOG_CLEANUP_BATCH_SIZE
		});
		if (deleted === AUDIT_LOG_CLEANUP_BATCH_SIZE) {
			await ctx.scheduler.runAfter(
				0,
				internal.auditLogs.mutations.cleanupAuditLogs.cleanupAuditLogs,
				{}
			);
		}
		return deleted;
	}
});
