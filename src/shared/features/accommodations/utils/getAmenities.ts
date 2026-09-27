// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// DATA
import { AMENITIES } from '../data/accommodationsData.js';

// TYPES
import type { AmenityKey } from '../types/amenityTypes.js';

function getAmenityLabel(key: AmenityKey) {
	return m[`AccommodationsFeature.AccommodationAmenities.${key}`]();
}

export function getAmenities() {
	return AMENITIES.map((amenity) => ({
		...amenity,
		label: getAmenityLabel(amenity.key)
	}));
}
