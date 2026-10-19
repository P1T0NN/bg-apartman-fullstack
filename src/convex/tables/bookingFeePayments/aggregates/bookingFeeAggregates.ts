// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

type HostFeeAggregate = {
	Namespace: [string, string];
	Key: number;
	DataModel: DataModel;
	TableName: 'bookingFeePayments';
};

export const bookingFeePendingAggregate = new TableAggregate<HostFeeAggregate>(
	components.bookingFeePendingAggregate,
	{
		namespace: (fee) => [fee.hostId, fee.currency],
		sortKey: (fee) => fee.accruedAt,
		sumValue: (fee) => (fee.pendingOnlineSplit && fee.paidAt === undefined ? fee.amountMinor : 0)
	}
);

/** Retained legacy test history; only explicit seed cleanup removes these old entries. */
export const legacyBookingFeeAggregate = new TableAggregate<HostFeeAggregate>(
	components.bookingFeeDueAggregate,
	{
		namespace: (fee) => [fee.hostId, fee.currency],
		sortKey: (fee) => fee.accruedAt,
		sumValue: (fee) => (fee.paidAt === undefined ? fee.amountMinor : 0)
	}
);

export const bookingFeePaidAggregate = new TableAggregate<HostFeeAggregate>(
	components.bookingFeePaidAggregate,
	{
		namespace: (fee) => [fee.hostId, fee.currency],
		sortKey: (fee) => fee.paidAt ?? fee.accruedAt,
		sumValue: (fee) => (fee.paidAt === undefined ? 0 : fee.amountMinor - fee.refundedAmountMinor)
	}
);

/** Like flat-fee earnings, confirmed refunds adjust the original collection date. */
export const bookingFeeRevenueAggregate = new TableAggregate<{
	Namespace: string;
	Key: number;
	DataModel: DataModel;
	TableName: 'bookingFeePayments';
}>(components.bookingFeeRevenueAggregate, {
	namespace: (fee) => fee.currency,
	sortKey: (fee) => fee.paidAt ?? fee.accruedAt,
	sumValue: (fee) => (fee.paidAt === undefined ? 0 : fee.amountMinor - fee.refundedAmountMinor)
});
