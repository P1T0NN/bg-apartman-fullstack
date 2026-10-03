<script lang="ts">
	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';
	import type { CancellationPolicy } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';

	let {
		mode,
		context,
		groupName
	}: {
		mode: CancellationPolicy['mode'];
		context: FormFieldContext<FormValue>;
		groupName: string;
	} = $props();

	const uid = $props.id();
</script>

<Field.Field orientation="horizontal">
	<input
		id={uid}
		type="radio"
		name={groupName}
		value={mode}
		checked={context.inputValue('cancellationPolicy.mode') === mode}
		disabled={context.disabled}
		onchange={() => context.setValue('cancellationPolicy.mode', mode)}
		class="size-4 shrink-0 accent-primary"
	/>
	<Field.Label for={uid}>
		{m[`AccommodationsFeature.AccommodationCancellationPolicyModeItem.${mode}`]()}
	</Field.Label>
</Field.Field>
