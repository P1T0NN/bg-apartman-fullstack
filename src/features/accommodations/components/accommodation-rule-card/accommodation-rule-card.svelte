<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	let {
		icon,
		label,
		description,
		checked,
		disabled = false,
		onCheckedChange
	}: {
		icon: string;
		label: string;
		description: string;
		checked: boolean;
		disabled?: boolean;
		onCheckedChange: (checked: boolean) => void;
	} = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	{disabled}
	class={cn(
		'flex w-full items-center gap-4 rounded-4xl bg-card px-6 py-5 text-left text-sm shadow-md ring-1 ring-foreground/5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
		checked ? 'bg-primary/5 ring-primary/40' : 'hover:bg-muted/50',
		disabled && 'pointer-events-none opacity-50'
	)}
	onclick={() => onCheckedChange(!checked)}
>
	<span
		class={cn(icon, 'size-6 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')}
		aria-hidden="true"
	></span>
	<span class="flex min-w-0 flex-1 flex-col gap-1">
		<span class="font-medium">{label}</span>
		<span class="text-muted-foreground">{description}</span>
	</span>
	<span class={cn('shrink-0 font-medium', checked ? 'text-primary' : 'text-muted-foreground')}>
		{checked
			? m['AccommodationsFeature.AccommodationRuleCard.enabled']()
			: m['AccommodationsFeature.AccommodationRuleCard.disabled']()}
	</span>
</button>
