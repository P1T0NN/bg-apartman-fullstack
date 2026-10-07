<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { layout }: { layout: 'table' | 'stacked' } = $props();
</script>

<div aria-hidden="true" class="flex flex-col gap-3">
	{#each [1, 2, 3] as row (row)}
		<div
			class={cn(
				'rounded-xl border p-4 sm:p-5',
				layout === 'table'
					? 'grid grid-cols-[2fr_repeat(4,1fr)_1.5fr] items-center gap-4'
					: 'flex flex-col gap-4'
			)}
		>
			<div class="flex items-center gap-3">
				<Skeleton class="size-14 shrink-0 rounded-lg" />
				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-32" /><Skeleton class="h-3 w-24" />
				</div>
			</div>
			<Skeleton class="h-6 w-24 rounded-full" />
			<div class="flex flex-col gap-2">
				<Skeleton class="h-4 w-24" /><Skeleton class="h-3 w-28" />
			</div>
			<Skeleton class="h-5 w-20" />
			<Skeleton class="h-4 w-24" />
			<Skeleton class="h-9 w-24 rounded-lg" />
		</div>
	{/each}
</div>
