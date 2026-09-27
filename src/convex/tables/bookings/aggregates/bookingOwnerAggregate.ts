// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';
import type { BookingOwnerAggregateKey } from '../../../../shared/features/bookings/types/bookingTypes.js';

/** Per-owner booking totals; unclaimed guest bookings stay outside every owner namespace. */
export const bookingOwnerAggregate = new TableAggregate<{
	Namespace: string | undefined;
	Key: BookingOwnerAggregateKey;
	DataModel: DataModel;
	TableName: 'bookings';
}>(components.bookingOwnerAggregate, {
	namespace: (booking) => booking.ownerId,
	sortKey: (booking) => booking._creationTime
});
