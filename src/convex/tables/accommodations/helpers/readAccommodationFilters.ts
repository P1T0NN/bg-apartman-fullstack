// CONFIG
import { ACCOMMODATION_TYPES } from '../../../../shared/features/accommodations/data/accommodationsData.js';

// TYPES
import type { AccommodationType } from '../../../../shared/features/accommodations/types/accommodationTypes.js';

export type AccommodationFilters = {
	type?: AccommodationType;
};

function isAccommodationType(value: string | undefined): value is AccommodationType {
	return value !== undefined && ACCOMMODATION_TYPES.some((type) => type === value);
}

/** Read the validated accommodation filter values from the symbolic filter record. */
export function readAccommodationFilters(
	filters: Record<string, string> | undefined
): AccommodationFilters {
	const type = filters?.type;

	return { type: isAccommodationType(type) ? type : undefined };
}
