<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';

	// UTILS
	import { formControlAttrs } from '@/components/ui/custom-components/form/formControl.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const id = $props.id();

	const field = $derived({
		name: 'sameDayReservation',
		label: m['AccommodationsFeature.ReservationRulesHost.sameDayLabel'](),
		description: m['AccommodationsFeature.ReservationRulesHost.sameDayHint']()
	});
</script>

<div class="flex flex-col gap-4">
	<Field.Field
		orientation="horizontal"
		data-disabled={context.disabled}
		data-invalid={Boolean(context.errors[field.name])}
	>
		<input
			{...formControlAttrs(field, context.errors[field.name])}
			{id}
			aria-describedby={`${id}-hint ${id}-limitations${context.errors[field.name] ? ` ${field.name}-error` : ''}`}
			type="checkbox"
			role="switch"
			checked={context.checkboxValue(field.name)}
			disabled={context.disabled}
			class="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-input p-0.5 transition-colors after:block after:size-4 after:rounded-full after:bg-background after:shadow-sm after:transition-transform checked:border-primary checked:bg-primary checked:after:translate-x-5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			onchange={(event) => context.setValue(field.name, event.currentTarget.checked)}
		/>

		<Field.Content class="min-w-0">
			<Field.Label for={id}>{field.label}</Field.Label>
			<Field.Description id={`${id}-hint`}>{field.description}</Field.Description>
			{#if context.errors[field.name]}
				<Field.Error id={`${field.name}-error`}>{context.errors[field.name]}</Field.Error>
			{/if}
		</Field.Content>
	</Field.Field>

	<p id={`${id}-limitations`} class="text-sm leading-6 text-muted-foreground">
		{m['AccommodationsFeature.ReservationRulesHost.sameDayLimitations']()}
	</p>
</div>
