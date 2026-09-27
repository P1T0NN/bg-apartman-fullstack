// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const FEEDBACK_FILTER_DEFS = [
	{
		key: 'type',
		label: 'Type',
		options: [
			{ value: '', label: 'All types' },
			{ value: 'bug', label: 'Bugs' },
			{ value: 'question', label: 'Questions' }
		]
	},
	{
		key: 'category',
		label: 'Area',
		options: [
			{ value: '', label: 'All areas' },
			{ value: 'booking', label: 'Booking' },
			{ value: 'payment', label: 'Payment' },
			{ value: 'account', label: 'Account' },
			{ value: 'accommodation', label: 'Accommodation' },
			{ value: 'other', label: 'Other' }
		]
	}
] satisfies FilterDef[];
