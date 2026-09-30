<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-busy="true">
	<div class="flex flex-col gap-5 pb-9 sm:flex-row sm:items-center sm:gap-6 sm:pb-12">
		<Skeleton class="size-16 shrink-0 rounded-full" />
		<div class="flex w-full flex-col gap-3">
			<Skeleton class="h-4 w-48 max-w-full" />
			<Skeleton class="h-10 w-96 max-w-full" />
			<Skeleton class="h-5 w-full max-w-lg" />
		</div>
	</div>
	<div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
		<div class="flex flex-col gap-7 rounded-2xl border p-6 sm:p-8">
			<Skeleton class="h-4 w-28" />
			<Skeleton class="h-8 w-3/4" />
			<div class="grid grid-cols-2 gap-5">
				<Skeleton class="h-16 w-full" />
				<Skeleton class="h-16 w-full" />
			</div>
			<Skeleton class="h-20 w-full" />
			<Skeleton class="h-10 w-48 max-w-full rounded-full" />
		</div>
		<div class="flex flex-col gap-4 pt-1 lg:pt-7">
			<Skeleton class="h-6 w-40" />
			<Skeleton class="h-24 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	</div>
</div>
