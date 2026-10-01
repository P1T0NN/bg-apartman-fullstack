// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel, Id } from '../../../_generated/dataModel.js';

/** Only published reviews enter this aggregate; moderation changes it atomically. */
export const reviewAggregate = new TableAggregate<{
	Namespace: Id<'accommodations'>;
	Key: number;
	DataModel: DataModel;
	TableName: 'reviews';
}>(components.reviewsAggregate, {
	namespace: (review) => review.accommodationId,
	sortKey: (review) => review.rating,
	sumValue: (review) => review.rating
});
