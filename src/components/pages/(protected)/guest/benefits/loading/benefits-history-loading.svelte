<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col divide-y border-y" aria-hidden="true">
	{#each [1, 2, 3] as row (row)}
		<div class="flex flex-col gap-2 py-4">
			<Skeleton class="h-5 w-48" />
			<Skeleton class="h-4 w-24" />
			<Skeleton class="h-4 w-56" />
		</div>
	{/each}
</div>
