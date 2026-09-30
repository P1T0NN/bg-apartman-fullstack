<script lang="ts">
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	let { count = 4 }: { count?: number } = $props();
</script>

<div role="status" aria-busy="true" class="flex flex-col gap-4">
	{#each Array.from({ length: count }, (_, index) => index) as index (index)}
		<div aria-hidden="true" class="overflow-hidden rounded-2xl border bg-card">
			<div
				class="grid grid-cols-[4rem_minmax(0,1fr)] gap-5 p-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6 sm:p-6"
			>
				<Skeleton class="size-16 rounded-xl sm:size-28" />
				<div class="contents sm:flex sm:min-w-0 sm:flex-col sm:gap-6">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="flex flex-1 flex-col gap-2">
							<Skeleton class="h-6 w-64 max-w-full" />
							<Skeleton class="h-4 w-36 max-w-full" />
						</div>
						<Skeleton class="h-5 w-28 rounded-full" />
					</div>
					<div class="col-span-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
						<Skeleton class="h-10 w-full" />
						<Skeleton class="h-10 w-full" />
						<Skeleton class="col-span-2 h-10 w-40 max-w-full sm:col-span-1" />
					</div>
				</div>
			</div>
			<div
				class="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
			>
				<Skeleton class="h-5 w-80 max-w-full" />
				<Skeleton class="h-10 w-full rounded-full sm:w-44" />
			</div>
			<div class="border-t px-5 py-4 sm:px-6"><Skeleton class="h-4 w-48 max-w-full" /></div>
		</div>
	{/each}
</div>
