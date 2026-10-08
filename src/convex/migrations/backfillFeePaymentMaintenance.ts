// CONVEX
import { migrations } from './migrations.js';

/** Resume verification of existing unpaid attempts without assuming their provider state. */
export const backfillFeePaymentMaintenance = migrations.define({
	table: 'accommodationFeePayments',
	migrateOne: async (ctx, payment) => {
		const needsRecovery =
			payment.nextReconcileAt === undefined &&
			payment.cleanupAt === undefined &&
			payment.status !== 'paid' &&
			payment.status !== 'refunded';
		if (!needsRecovery) return;
		await ctx.db.patch('accommodationFeePayments', payment._id, { nextReconcileAt: Date.now() });
	}
});
