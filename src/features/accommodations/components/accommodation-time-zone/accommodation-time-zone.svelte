<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let {
		context,
		pending = false,
		error = '',
		onretry
	}: {
		context: FormFieldContext<FormValue>;
		pending?: boolean;
		error?: string;
		onretry?: () => void;
	} = $props();

	const uid = $props.id();

	const fieldError = $derived(error || context.errors.timeZone);
</script>

<Field.Field data-invalid={Boolean(fieldError)}>
	<Field.Label for={uid}>{m['AccommodationsFeature.AccommodationTimeZone.label']()}</Field.Label>

	<Input
		id={uid}
		name="timeZone"
		value={context.inputValue('timeZone')}
		readonly
		disabled={context.disabled}
		placeholder={m['AccommodationsFeature.AccommodationTimeZone.placeholder']()}
		aria-invalid={Boolean(fieldError)}
		aria-describedby={`${uid}-hint${fieldError ? ` ${uid}-error` : ''}`}
	/>

	<Field.Description id={`${uid}-hint`}>
		{m['AccommodationsFeature.AccommodationTimeZone.hint']()}
	</Field.Description>

	{#if pending}
		<p class="text-sm text-muted-foreground" role="status">
			{m['AccommodationsFeature.AccommodationTimeZone.detecting']()}
		</p>
	{/if}

	{#if fieldError}
		<Field.Error id={`${uid}-error`}>{fieldError}</Field.Error>

		{#if onretry}
			<Button
				type="button"
				variant="outline"
				class="w-fit"
				disabled={context.disabled || pending}
				onclick={onretry}
			>
				{m['AccommodationsFeature.AccommodationTimeZone.retry']()}
			</Button>
		{/if}
	{/if}
</Field.Field>
