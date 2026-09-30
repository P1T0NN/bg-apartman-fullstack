<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	let { layout = 'table' }: { layout?: 'table' | 'stacked' } = $props();
</script>

<div aria-hidden="true" class="flex flex-col gap-3">
	{#each [1, 2, 3] as row (row)}
		<div
			class={layout === 'stacked'
				? 'flex flex-col gap-5 rounded-xl border p-5'
				: 'grid grid-cols-5 items-center gap-6 rounded-xl border p-5'}
		>
			<div class="flex items-center gap-3">
				<Skeleton class="size-8 rounded-full" />
				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-28" /><Skeleton class="h-3 w-20" />
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<Skeleton class="h-4 w-36" /><Skeleton class="h-3 w-24" />
			</div>
			<Skeleton class="h-10 w-32" />
			{#if layout === 'table'}<Skeleton class="h-6 w-20 rounded-full" />{/if}
			<div class="flex gap-2">
				<Skeleton class="h-9 w-20 rounded-full" /><Skeleton class="h-9 w-20 rounded-full" />
			</div>
		</div>
	{/each}
</div>
