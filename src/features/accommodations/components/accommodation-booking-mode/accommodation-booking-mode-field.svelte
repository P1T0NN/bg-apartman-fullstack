<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
	import FormSelect from '@/components/ui/custom-components/form/form-select.svelte';
	import type {
		FormFieldContext,
		FormValue,
		SelectField
	} from '@/components/ui/custom-components/form/formTypes.js';
	let { context }: { context: FormFieldContext<FormValue> } = $props();
	const field = $derived<SelectField>({
		kind: 'select',
		name: 'bookingMode',
		required: true,
		label: m['AccommodationsFeature.BookingMode.label'](),
		description: m['AccommodationsFeature.BookingMode.hostHint'](),
		options: [
			{ value: 'request', label: m['AccommodationsFeature.BookingMode.requestRecommended']() },
			{ value: 'instant', label: m['AccommodationsFeature.BookingMode.instant']() }
		]
	});
</script>

<div class="flex flex-col gap-3">
	<FormSelect
		{field}
		value={context.inputValue('bookingMode')}
		error={context.errors.bookingMode}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue('bookingMode', value)}
	/>
	<p class="rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
		{m['AccommodationsFeature.BookingMode.recommendation']()}
	</p>
</div>
