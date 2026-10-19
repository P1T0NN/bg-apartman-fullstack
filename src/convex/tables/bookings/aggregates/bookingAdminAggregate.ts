// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

/** Global booking counts and current cancellations, grouped by booking creation time. */
export const bookingAdminAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'bookings';
}>(components.bookingAdminAggregate, {
	sortKey: (booking) => booking._creationTime,
	sumValue: (booking) => (booking.status === 'cancelled' ? 1 : 0)
});
