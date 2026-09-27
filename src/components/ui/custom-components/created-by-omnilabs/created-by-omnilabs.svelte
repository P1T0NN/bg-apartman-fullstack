<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	const OMNILABS_HREF = 'https://omnilabs.us';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();
</script>

<!--
	Branded credit: label + Omnilabs logo (static/omnilabs/logo-transparent-1280w.webp).
	Entire block is one link for a clear tap/click target.
-->
<a
	href={OMNILABS_HREF}
	target="_blank"
	rel="noopener noreferrer external"
	class={cn(
		'group flex max-w-[200px] flex-col items-center gap-2.5',
		'sm:ml-auto sm:items-end',
		'rounded-xl border border-primary-foreground/15 bg-primary-foreground/4 px-4 py-3.5',
		'shadow-sm backdrop-blur-sm',
		'transition-[transform,box-shadow,border-color,background-color] duration-300',
		'hover:-translate-y-0.5 hover:border-primary-foreground/25 hover:bg-primary-foreground/7 hover:shadow-md',
		'focus-visible:ring-2 focus-visible:ring-primary-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground focus-visible:outline-none',
		className
	)}
	aria-label="Created by OmniLabs — opens in a new tab"
>
	<span
		class="text-[0.625rem] font-semibold tracking-[0.28em] text-primary-foreground/50 uppercase transition-colors group-hover:text-primary-foreground/70"
	>
		Created by
	</span>

	<img
		src="/omnilabs/logo-transparent-1280w.webp"
		width={180}
		height={40}
		class="h-7 w-auto max-w-[168px] object-contain object-center opacity-95 transition-opacity duration-300 group-hover:opacity-100 sm:object-right"
		alt=""
		loading="lazy"
		decoding="async"
		fetchpriority="low"
	/>
</a>
