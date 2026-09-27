<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ListingSection } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		section,
		summary,
		onopen
	}: {
		section: ListingSection;
		summary: string;
		onopen: () => void;
	} = $props();
</script>

<li>
	<button
		type="button"
		onclick={onopen}
		class="group flex min-h-24 w-full items-center gap-4 rounded-lg px-3 py-5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-4"
	>
		<span
			class="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground"
			><span class={cn(section.icon, 'size-5')} aria-hidden="true"></span></span
		>

		<span class="flex min-w-0 flex-1 flex-col gap-1.5"
			><span class="font-medium">{section.title}</span><span
				class="text-sm leading-relaxed text-muted-foreground">{summary}</span
			></span
		>

		<span
			class="icon-[lucide--chevron-right] size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
			aria-hidden="true"
		></span>
	</button>
</li>
