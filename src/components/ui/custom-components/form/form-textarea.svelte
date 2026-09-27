<script lang="ts">
	// COMPONENTS
	import Textarea from '@/components/ui/textarea/textarea.svelte';
	import FormField from './form-field.svelte';

	// UTILS
	import { formControlAttrs, formControlInput } from './formControl.js';

	// TYPES
	import type { TextareaField } from './formTypes.js';

	type Props = {
		field: TextareaField;
		value: string;
		disabled?: boolean;
		error?: string;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, error, onValueChange }: Props = $props();
</script>

<FormField {field} {disabled} {error}>
	<Textarea
		{...formControlAttrs(field, error)}
		{value}
		rows={field.rows}
		placeholder={field.placeholder}
		required={field.required}
		{disabled}
		oninput={formControlInput(onValueChange)}
	/>
</FormField>
