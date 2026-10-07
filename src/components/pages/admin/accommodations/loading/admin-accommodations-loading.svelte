<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-4 rounded-xl border p-4" aria-hidden="true">
	{#each [1, 2, 3] as row (row)}
		<div class="grid grid-cols-7 items-center gap-4">
			<Skeleton class="h-14 w-full" />
			{#each [1, 2, 3, 4, 5, 6] as column (column)}<Skeleton class="h-5 w-full" />{/each}
		</div>
	{/each}
</div>
