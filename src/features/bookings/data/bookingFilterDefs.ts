// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

/** Symbolic booking filters; the server maps each value to an index or search filter. */
export const HOST_BOOKING_FILTER_DEFS = [
	{
		key: 'status',
		label: 'Status',
		options: [
			{ value: '', label: 'All statuses' },
			{ value: 'pending', label: 'Pending' },
			{ value: 'confirmed', label: 'Confirmed' },
			{ value: 'declined', label: 'Declined' },
			{ value: 'cancelled', label: 'Cancelled' },
			{ value: 'completed', label: 'Completed' }
		]
	}
] satisfies FilterDef[];
