// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

export function createNewsletterFields(): FieldConfig[] {
	return [
		{
			kind: 'input',
			name: 'email',
			label: m['NewslettersFeature.NewslettersSection.emailLabel'](),
			placeholder: m['NewslettersFeature.NewslettersSection.emailPlaceholder'](),
			type: 'email',
			required: true
		}
	];
}
