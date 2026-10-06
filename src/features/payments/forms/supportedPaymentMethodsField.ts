import { m } from '@/lib/paraglide/messages';
import type { SelectField } from '@/components/ui/custom-components/form/formTypes.js';

export function supportedPaymentMethodsField(): SelectField {
	return {
		kind: 'select',
		name: 'supportedPaymentMethods',
		label: m['PaymentsFeature.supported'](),
		required: true,
		options: (['cash', 'online', 'both'] as const).map((value) => ({
			value,
			label: m[`PaymentsFeature.supportedOptions.${value}`]()
		}))
	};
}
