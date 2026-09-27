<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	let { count = 4 }: { count?: number } = $props();
</script>

<div class="grid gap-4 lg:grid-cols-2">
	{#each Array(count)}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex items-center justify-between gap-3">
					<Skeleton class="h-5 w-1/2" />
					<Skeleton class="h-6 w-20" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<Skeleton class="h-16 w-full rounded-3xl" />
					<Skeleton class="h-16 w-full rounded-3xl" />
				</div>
				<Skeleton class="h-4 w-2/3" />
			</Card.Content>
		</Card.Root>
	{/each}
</div>
