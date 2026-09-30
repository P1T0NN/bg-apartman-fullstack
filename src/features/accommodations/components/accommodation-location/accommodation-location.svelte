<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		city,
		country,
		class: className
	}: { city?: string; country?: string; class?: string } = $props();

	const text = $derived([city, country].filter(Boolean).join(', '));
</script>

{#if text}
	<span class={cn(className)}>{text}</span>
{/if}
