// LIBRARIES
import { TableAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../_generated/api.js';

// TYPES
import type { DataModel } from '../../../_generated/dataModel.js';

export const feedbackAggregate = new TableAggregate<{
	Key: number;
	DataModel: DataModel;
	TableName: 'feedbacks';
}>(components.feedbacksAggregate, {
	sortKey: (feedback) => feedback._creationTime
});
