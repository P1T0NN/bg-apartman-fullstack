<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	let { count = 6 }: { count?: number } = $props();
</script>

<div
	class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-5"
	aria-hidden="true"
>
	{#each Array(count)}
		<Card.Root
			class="min-w-0 rounded-2xl border border-border pt-0 shadow-none ring-0 [--card-spacing:--spacing(5)]"
		>
			<Skeleton class="aspect-3/2 w-full rounded-none" />
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-6 w-3/4" />
					<Skeleton class="h-5 w-1/2" />
				</div>
				<div class="grid grid-cols-2 gap-x-5 gap-y-2">
					<Skeleton class="h-5 w-full" />
					<Skeleton class="h-5 w-full" />
					<Skeleton class="h-5 w-full" />
					<Skeleton class="h-5 w-full" />
				</div>
				<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
					<Skeleton class="h-7 w-32" />
					<Skeleton class="h-9 w-20 rounded-full" />
				</div>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
