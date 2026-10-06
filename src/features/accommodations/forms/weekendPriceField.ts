// LIBRARIES
import { m } from '@/lib/paraglide/messages';
// TYPES
import type { InputField } from '@/components/ui/custom-components/form/formTypes.js';

export function weekendPriceField(): InputField {
	return {
		kind: 'input',
		type: 'number',
		name: 'weekendPrice',
		label: m['AccommodationsFeature.Pricing.weekend'](),
		description: m['AccommodationsFeature.Pricing.weekendHint'](),
		min: 0.01,
		max: 100000,
		step: 0.01
	};
}
