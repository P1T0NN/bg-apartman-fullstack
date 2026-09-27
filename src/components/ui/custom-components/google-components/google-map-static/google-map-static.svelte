<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		destination,
		title,
		zoom = 13,
		loading = 'eager',
		class: className
	}: {
		destination: string;
		title: string;
		zoom?: number;
		loading?: 'eager' | 'lazy';
		class?: string;
	} = $props();
</script>

<iframe
	{title}
	src={`https://maps.google.com/maps?q=${encodeURIComponent(destination)}&z=${zoom}&output=embed`}
	class={cn('h-72 w-full border-0 sm:h-80', className)}
	{loading}
	referrerpolicy="no-referrer-when-downgrade"
	allowfullscreen
></iframe>
