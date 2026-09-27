<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let { src, alt, index }: { src: string; alt: string; index: number } = $props();
</script>

<img
	{src}
	{alt}
	loading={index === 0 ? 'eager' : 'lazy'}
	fetchpriority={index === 0 ? 'high' : 'auto'}
	decoding="async"
	class={cn(
		'size-full min-h-0 object-cover',
		index === 0 ? 'col-span-2 row-span-2' : 'hidden md:block'
	)}
/>
