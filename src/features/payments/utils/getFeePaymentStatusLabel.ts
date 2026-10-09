// LIBRARIES
import { m } from '@/lib/paraglide/messages.js';

// TYPES
import type { FunctionReturnType } from 'convex/server';
import type { api } from '@convex/_generated/api.js';

export function getFeePaymentStatusLabel(
	payment: FunctionReturnType<
		typeof api.tables.accommodationFeePayments.queries.fetchFeePayments.fetchFeePayments
	>['items'][number]
) {
	const hasFailedRefund =
		payment.status === 'refund_pending' &&
		(payment.refundStatus === 'failed' || payment.refundStatus === 'canceled');

	if (hasFailedRefund) return m['PaymentsFeature.FeePayments.refundFailed']();

	const isPartiallyRefunded = payment.status === 'paid' && payment.refundedAmountMinor > 0;

	if (isPartiallyRefunded) return m['PaymentsFeature.FeePayments.partiallyRefunded']();

	const labels = {
		creating: m['PaymentsFeature.FeePayments.creating'],
		pending: m['PaymentsFeature.FeePayments.pending'],
		processing: m['PaymentsFeature.FeePayments.processing'],
		paid: m['PaymentsFeature.FeePayments.paid'],
		expired: m['PaymentsFeature.FeePayments.expired'],
		failed: m['PaymentsFeature.FeePayments.failed'],
		refund_pending: m['PaymentsFeature.FeePayments.refundPending'],
		refunded: m['PaymentsFeature.FeePayments.refunded']
	};

	return labels[payment.status]();
}
