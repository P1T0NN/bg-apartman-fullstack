// LIBRARIES
import { m } from '@/lib/paraglide/messages';
// TYPES
import type { InputField } from '@/components/ui/custom-components/form/formTypes.js';

export function discountPercentField(): InputField {
	return {
		kind: 'input',
		type: 'number',
		name: 'discountPercent',
		label: m['AccommodationsFeature.Pricing.discount'](),
		description: m['AccommodationsFeature.Pricing.discountHint'](),
		min: 0,
		max: 99.99,
		step: 0.01,
		required: true
	};
}
