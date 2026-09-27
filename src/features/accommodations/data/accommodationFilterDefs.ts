// CONFIG
import { ACCOMMODATION_TYPES } from '@/shared/features/accommodations/types/accommodationTypes.js';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';
import type { AccommodationType } from '@/shared/features/accommodations/types/accommodationTypes.js';

const TYPE_LABELS = {
	apartment: 'Apartment',
	studio: 'Studio',
	house: 'House',
	villa: 'Villa',
	room: 'Room',
	other: 'Other'
} satisfies Record<AccommodationType, string>;

export const ACCOMMODATION_FILTER_DEFS = [
	{
		key: 'type',
		label: 'Type',
		options: [
			{ value: '', label: 'All types' },
			...ACCOMMODATION_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type] }))
		]
	}
] satisfies FilterDef[];
