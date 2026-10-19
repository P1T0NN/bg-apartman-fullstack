// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

/** Collected listing fees less confirmed refunds, attributed to the original payment date. */
export const flatFeeRevenueAggregate = new TableAggregate<{
	Namespace: string;
	Key: number;
	DataModel: DataModel;
	TableName: 'accommodationFeePayments';
}>(components.flatFeeRevenueAggregate, {
	namespace: (payment) => payment.terms.currency,
	sortKey: (payment) => payment.paidAt ?? payment._creationTime,
	sumValue: (payment) => payment.terms.amountMinor - payment.refundedAmountMinor
});
