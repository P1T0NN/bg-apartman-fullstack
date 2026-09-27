// LIBRARIES
import { DirectAggregate } from '@convex-dev/aggregate';

// CONVEX
import { components } from '../../../../_generated/api.js';

/** Exact global user total maintained by Better Auth user triggers. */
export const userTotalAggregate = new DirectAggregate<{ Key: string; Id: string }>(
	components.userTotalAggregate
);
