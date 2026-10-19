// HELPERS
import { getHostPayoutsEnabled } from '../../../betterAuth/helpers/getHostPayoutsEnabled.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { QueryCtx } from '../../../_generated/server.js';

export async function isAccommodationPublic(
	ctx: Pick<QueryCtx, 'runQuery'>,
	accommodation: Doc<'accommodations'> | null
): Promise<boolean> {
	if (!isAccommodationVisible(accommodation, true)) return false;
	return getHostPayoutsEnabled(ctx, accommodation.ownerId);
}
