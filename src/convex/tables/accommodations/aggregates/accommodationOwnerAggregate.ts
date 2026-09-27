// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';
import type { AccommodationOwnerAggregateKey } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

/** Per-owner accommodation totals, keyed by type for exact type-filtered counts. */
export const accommodationOwnerAggregate = new TableAggregate<{
	Namespace: string;
	Key: AccommodationOwnerAggregateKey;
	DataModel: DataModel;
	TableName: 'accommodations';
}>(components.accommodationOwnerAggregate, {
	namespace: (accommodation) => accommodation.ownerId,
	sortKey: (accommodation) => [accommodation.type, accommodation._creationTime]
});
