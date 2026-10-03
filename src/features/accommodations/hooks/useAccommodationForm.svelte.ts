// CONFIG
import { accommodationSectionSchemas } from '@/shared/features/accommodations/schemas/accommodationSchemas.js';

// DATA
import { EMPTY_ACCOMMODATION } from '@/shared/features/accommodations/data/accommodationsData.js';

// UTILS
import { formValidationErrors } from '@/components/ui/custom-components/form/formValues.js';

// TYPES
import type { FormValues } from '@/components/ui/custom-components/form/formTypes.js';
import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

type AccommodationFormState = {
	values: FormValues;
	pinAddress: string;
	files: PreviewFile[];
	step: number;
	furthestStep: number;
	submitting: boolean;
};

export function createAccommodationForm() {
	const state = $state<AccommodationFormState>({
		values: $state.snapshot(EMPTY_ACCOMMODATION),
		pinAddress: '',
		files: [],
		step: 0,
		furthestStep: 0,
		submitting: false
	});

	function goTo(step: number) {
		state.step = step;
		state.furthestStep = Math.max(state.furthestStep, step);
	}

	function validate(errors: Record<string, string>) {
		const schema = accommodationSectionSchemas[state.step];
		if (!schema) return false;

		const result = schema.safeParse({
			...state.values,
			imageKeys: state.files.map((file) => file.id)
		});

		for (const name of Object.keys(errors)) errors[name] = '';
		Object.assign(errors, formValidationErrors(result.error?.issues ?? []));
		return result.success;
	}

	return {
		state,
		goTo,
		validate,
		next: () => goTo(state.step + 1),
		back: () => goTo(state.step - 1)
	};
}
