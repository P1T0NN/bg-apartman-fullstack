<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	const placeholderCount = 3;
</script>

<ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
	{#each Array.from({ length: placeholderCount }) as _, index (index)}
		<li class="flex flex-col gap-3">
			<Skeleton class="aspect-[4/3] w-full rounded-2xl" />
			<div class="flex flex-col gap-2 px-1">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-5 w-3/4" />
				<Skeleton class="h-4 w-1/2" />
				<Skeleton class="mt-2 h-6 w-28" />
			</div>
		</li>
	{/each}
</ul>
