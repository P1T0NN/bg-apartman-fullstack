// TYPES
import type { AmenityKey } from '@/shared/features/accommodations/types/amenityTypes.js';

type AmenityDialogState = {
	draft: AmenityKey[];
	search: string;
	selectedOnly: boolean;
};

export function useAmenityDialog(options: {
	getSelected: () => AmenityKey[];
	onSave: (selected: AmenityKey[]) => void;
}) {
	const { getSelected, onSave } = options;

	const state = $state<AmenityDialogState>({
		draft: [],
		search: '',
		selectedOnly: false
	});

	const selected = $derived(getSelected());

	function toggle(key: AmenityKey, checked: boolean) {
		state.draft = checked ? [...state.draft, key] : state.draft.filter((item) => item !== key);
	}

	function toggleSelectedOnly() {
		state.selectedOnly = !state.selectedOnly;
	}

	function resetFilters() {
		state.search = '';
		state.selectedOnly = false;
	}

	function resetDraft() {
		// A fresh draft is created each time the dialog is opened.
		state.draft = [...selected];
		resetFilters();
	}

	function save() {
		onSave(state.draft);
	}

	return {
		state,
		toggle,
		toggleSelectedOnly,
		resetFilters,
		resetDraft,
		save
	};
}

export type AmenityDialog = ReturnType<typeof useAmenityDialog>;
