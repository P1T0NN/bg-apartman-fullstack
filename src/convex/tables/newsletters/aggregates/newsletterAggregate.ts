// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export const newsletterAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'newsletters';
}>(components.newslettersAggregate, {
	sortKey: (newsletter) => newsletter._creationTime
});
