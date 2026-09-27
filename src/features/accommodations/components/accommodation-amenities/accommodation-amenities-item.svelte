<script lang="ts">
	// COMPONENTS
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import * as Field from '@/components/ui/field/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		label,
		icon,
		checked,
		disabled,
		compact = false,
		onChange
	}: {
		label: string;
		icon: string;
		checked: boolean;
		disabled: boolean;
		compact?: boolean;
		onChange: (checked: boolean) => void;
	} = $props();

	const id = $props.id();
</script>

<Field.Field orientation="horizontal" data-disabled={disabled}>
	<Field.Label
		for={id}
		class={cn(
			'w-full cursor-pointer gap-3 rounded-lg px-3 font-normal transition-colors duration-150 hover:bg-muted/60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring has-data-checked:bg-primary/5 has-data-checked:font-semibold motion-reduce:transition-none',
			compact ? 'min-h-12 py-2' : 'min-h-15 py-3'
		)}
	>
		<span
			class={[icon, 'size-5 shrink-0', checked ? 'text-foreground' : 'text-muted-foreground']}
			aria-hidden="true"
		></span>
		<span class="min-w-0 flex-1 leading-snug">{label}</span>
		<Checkbox {id} {checked} {disabled} onCheckedChange={onChange} class="size-5" />
	</Field.Label>
</Field.Field>
