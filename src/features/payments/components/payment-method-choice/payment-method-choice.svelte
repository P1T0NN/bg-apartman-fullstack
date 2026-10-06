<script lang="ts">
	// COMPONENTS
	import CardSwitch from '@/components/ui/custom-components/card-switch/card-switch.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let {
		supported,
		value,
		disabled = false,
		error,
		onValueChange
	}: {
		supported: 'cash' | 'online' | 'both';
		value: 'cash' | 'online' | '';
		disabled?: boolean;
		error?: string;
		onValueChange: (value: 'cash' | 'online') => void;
	} = $props();

	const id = $props.id();
	const methods = $derived(supported === 'both' ? (['cash', 'online'] as const) : [supported]);
</script>

<fieldset
	{disabled}
	role="radiogroup"
	aria-invalid={!!error}
	tabindex={error ? -1 : undefined}
	aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
>
	<legend class="sr-only">{m['PaymentsFeature.method']()}</legend>
	<p id={`${id}-hint`} class="mb-5 max-w-prose text-sm leading-6 text-muted-foreground">
		{supported === 'both' ? m['PaymentsFeature.hint']() : m['PaymentsFeature.selectedHint']()}
	</p>
	<div class="grid gap-3">
		{#each methods as method (method)}
			<CardSwitch
				icon={method === 'cash' ? 'icon-[lucide--banknote]' : 'icon-[lucide--credit-card]'}
				label={m[`PaymentsFeature.methods.${method}`]()}
				description={method === 'cash'
					? m['PaymentsFeature.cashHint']()
					: m['PaymentsFeature.onlineHint']()}
				checked={supported !== 'both' || value === method}
				{disabled}
				class={error ? 'border-destructive' : undefined}
			>
				{#snippet control({ id: controlId, labelId, descriptionId })}
					<input
						id={controlId}
						type="radio"
						name="paymentMethod"
						value={method}
						checked={supported !== 'both' || value === method}
						{disabled}
						aria-labelledby={labelId}
						aria-describedby={`${descriptionId}${error ? ` ${id}-error` : ''}`}
						onchange={() => onValueChange(method)}
						class="size-5 shrink-0 accent-primary"
					/>
				{/snippet}
			</CardSwitch>
		{/each}
	</div>
	{#if error}<p id={`${id}-error`} role="alert" class="mt-3 text-sm text-destructive">
			{error}
		</p>{/if}
</fieldset>
