<script lang="ts">
	// COMPONENTS
	import CardSwitch from '@/components/ui/custom-components/card-switch/card-switch.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';
	import type { CancellationPolicyPreset } from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';

	let {
		mode,
		context,
		groupName
	}: {
		mode: CancellationPolicyPreset['mode'];
		context: FormFieldContext<FormValue>;
		groupName: string;
	} = $props();

	const icons = {
		flexible: 'icon-[lucide--calendar-check]',
		moderate: 'icon-[lucide--calendar-clock]',
		firm: 'icon-[lucide--shield-check]'
	};
	const checked = $derived(context.inputValue('cancellationPolicy.mode') === mode);
</script>

<CardSwitch
	icon={icons[mode]}
	label={m[`CancellationPolicies.${mode}`]()}
	description={m[`CancellationPolicies.${mode}Description`]()}
	{checked}
	disabled={context.disabled}
>
	{#snippet control({ id, labelId, descriptionId })}
		<input
			{id}
			type="radio"
			name={groupName}
			value={mode}
			{checked}
			aria-labelledby={labelId}
			aria-describedby={descriptionId}
			disabled={context.disabled}
			onchange={() => context.setValue('cancellationPolicy', { version: 1, mode })}
			class="size-5 shrink-0 accent-primary"
		/>
	{/snippet}
</CardSwitch>
