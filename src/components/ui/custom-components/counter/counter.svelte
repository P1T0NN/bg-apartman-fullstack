<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	let {
		value = $bindable(0),
		min = 0,
		max = Number.MAX_SAFE_INTEGER,
		label,
		disabled = false,
		class: className
	}: {
		value?: number;
		min?: number;
		max?: number;
		label: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	function decrease(): void {
		if (value > min) value -= 1;
	}

	function increase(): void {
		if (value < max) value += 1;
	}
</script>

<div class={cn('flex items-center justify-between gap-4', className)}>
	<span class="text-sm font-medium capitalize">{label}</span>

	<div class="flex items-center gap-1.5">
		<Button
			variant="default"
			size="icon-sm"
			onclick={decrease}
			disabled={disabled || value <= min}
			aria-label={m['Components.Counter.decrease']({ label })}
		>
			<span class="icon-[lucide--minus] size-4" aria-hidden="true"></span>
		</Button>

		<output class="w-6 text-center text-sm font-medium tabular-nums">{value}</output>

		<Button
			variant="default"
			size="icon-sm"
			onclick={increase}
			disabled={disabled || value >= max}
			aria-label={m['Components.Counter.increase']({ label })}
		>
			<span class="icon-[lucide--plus] size-4" aria-hidden="true"></span>
		</Button>
	</div>
</div>
