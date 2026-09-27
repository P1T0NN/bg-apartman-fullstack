<script lang="ts">
	// COMPONENTS
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import FormInput from '@/components/ui/custom-components/form/form-input.svelte';
	import FormTextarea from '@/components/ui/custom-components/form/form-textarea.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';
	let { context }: { context: FormFieldContext<FormValue> } = $props();
	const form = getAccommodationFormContext();
</script>

<Field.Group>
	<FormInput
		field={{
			kind: 'input',
			name: 'name',
			label: m['AddAccommodationPage.AddAccommodationFormPhotos.name'](),
			placeholder: m['AddAccommodationPage.AddAccommodationFormPhotos.namePlaceholder'](),
			description: m['AddAccommodationPage.AddAccommodationFormPhotos.nameHint'](),
			maxLength: 100,
			required: true
		}}
		value={context.inputValue('name')}
		error={context.errors['name']}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue('name', value)}
	/>
	<FormTextarea
		field={{
			kind: 'textarea',
			name: 'description',
			label: m['AddAccommodationPage.AddAccommodationFormPhotos.description'](),
			placeholder: m['AddAccommodationPage.AddAccommodationFormPhotos.descriptionPlaceholder'](),
			description: m['AddAccommodationPage.AddAccommodationFormPhotos.descriptionHint'](),
			required: true
		}}
		value={context.inputValue('description')}
		error={context.errors['description']}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue('description', value)}
	/>
</Field.Group>
<p role="status" class="text-sm text-muted-foreground">
	{m['AddAccommodationPage.AddAccommodationFormPhotos.photoCount']({
		count: form.state.files.length
	})}
</p>
<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}
		>{m['AddAccommodationPage.AddAccommodationFormPhotos.previous']()}</Button
	>
	<AddAccommodationContinueButton errors={context.errors} />
</div>
