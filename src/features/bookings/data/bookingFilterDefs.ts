// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

/** Symbolic booking filters; the server maps each value to an index or search filter. */
export const BOOKING_FILTER_DEFS = [
	{
		key: 'status',
		label: 'Status',
		options: [
			{ value: '', label: 'All statuses' },
			{ value: 'pending', label: 'Pending' },
			{ value: 'confirmed', label: 'Confirmed' },
			{ value: 'declined', label: 'Declined' },
			{ value: 'cancelled', label: 'Cancelled' },
			{ value: 'expired', label: 'Request expired' },
			{ value: 'completed', label: 'Completed' }
		]
	}
] satisfies FilterDef[];
