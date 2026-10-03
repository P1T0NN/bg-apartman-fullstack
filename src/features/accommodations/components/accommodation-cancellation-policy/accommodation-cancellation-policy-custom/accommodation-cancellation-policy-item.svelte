<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ACCOMMODATION_CONFIG } from '@/shared/features/accommodations/config.js';

	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// SCHEMAS
	import { cancellationPolicySchema } from '@/shared/features/accommodations/schemas/cancellationPolicySchemas.js';

	// TYPES
	import type { CancellationPolicyRange } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let {
		range,
		context
	}: {
		range: CancellationPolicyRange;
		context: FormFieldContext<FormValue>;
	} = $props();

	const uid = $props.id();

	const fieldName = $derived(`cancellationPolicy.${range}`);

	const validation = $derived(
		cancellationPolicySchema.safeParse(context.getValue('cancellationPolicy'))
	);

	const error = $derived.by(() => {
		if (validation.success) return;

		const issue = validation.error.issues.find((issue) => issue.path[0] === range);

		if (!issue) return;

		return issue.message === 'REFUND_INCREASES'
			? m['AccommodationsFeature.AccommodationCancellationPolicyItem.refundIncreases']()
			: m['AccommodationsFeature.AccommodationCancellationPolicyItem.invalidRefund']();
	});

	const refundOptions = $derived(
		ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES.map((percentage) => ({
			value: String(percentage),
			label: m[`AccommodationsFeature.AccommodationCancellationPolicyItem.refund${percentage}`]()
		}))
	);
</script>

<Field.Field data-invalid={Boolean(error)} data-disabled={context.disabled}>
	<div class="grid items-center gap-2 sm:grid-cols-2">
		<div class="flex flex-col gap-1 text-sm" id={`${uid}-time`}>
			<p>{m[`AccommodationsFeature.AccommodationCancellationPolicyItem.${range}`]()}</p>
			<p class="text-muted-foreground">
				{m[`AccommodationsFeature.AccommodationCancellationPolicyItem.${range}Example`]()}
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<Field.Label for={uid}>
				{m['AccommodationsFeature.AccommodationCancellationPolicyItem.guestRefund']()}
			</Field.Label>

			<NativeSelect
				id={uid}
				name={fieldName}
				value={context.inputValue(fieldName)}
				options={refundOptions}
				onchange={(value) => context.setValue(fieldName, Number(value))}
				includePlaceholderOption={false}
				disabled={context.disabled}
				required
				aria-invalid={Boolean(error)}
				aria-describedby={error ? `${uid}-time ${uid}-error` : `${uid}-time`}
				class="w-full aria-invalid:border-destructive"
			/>
		</div>
	</div>

	{#if error}
		<Field.Error id={`${uid}-error`}>{error}</Field.Error>
	{/if}
</Field.Field>
