// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

/** Confirmed/completed booking value, partitioned by original host and frozen currency. */
export const bookingHostAggregate = new TableAggregate<{
	Namespace: [string | null, string];
	Key: number;
	DataModel: DataModel;
	TableName: 'bookings';
}>(components.bookingHostAggregate, {
	namespace: (booking) => [booking.hostId ?? null, booking.cancellationTerms.currency],
	sortKey: (booking) => booking._creationTime,
	sumValue: (booking) => booking.cancellationTerms.stayPricing.totalMinor
});
