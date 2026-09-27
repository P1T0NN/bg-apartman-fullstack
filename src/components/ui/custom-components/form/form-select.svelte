<script lang="ts">
	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import FormField from './form-field.svelte';

	// UTILS
	import { formControlAttrs } from './formControl.js';

	// TYPES
	import type { SelectField } from './formTypes.js';

	type Props = {
		field: SelectField;
		value: string;
		disabled?: boolean;
		error?: string;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, error, onValueChange }: Props = $props();

	const selectClass =
		'w-full aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50';
</script>

<FormField {field} {disabled} {error}>
	<NativeSelect
		{...formControlAttrs(field, error)}
		options={field.options}
		{value}
		onchange={onValueChange}
		placeholderOnly
		label={field.label}
		required={field.required}
		{disabled}
		class={selectClass}
	/>
</FormField>
