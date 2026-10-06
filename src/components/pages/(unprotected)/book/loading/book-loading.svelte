<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-busy="true">
	<header class="pt-4 pb-8 sm:pb-10">
		<Skeleton class="mb-6 h-11 w-44" />
		<div class="mb-3 flex flex-wrap items-center gap-3">
			<Skeleton class="h-9 w-72 max-w-full sm:h-10" />
			<Skeleton class="h-5 w-28 rounded-3xl" />
		</div>
		<Skeleton class="h-4 w-full max-w-prose" />
		<Skeleton class="mt-2 h-4 w-2/3 max-w-prose" />
	</header>

	<div class="grid gap-8 py-6 lg:grid-cols-[1fr_23rem]">
		<div class="flex flex-col gap-5">
			<Skeleton class="h-8 w-2/3" /><Skeleton class="h-40 w-full" /><Skeleton
				class="h-8 w-1/2"
			/><Skeleton class="h-56 w-full" />
		</div>
		<Skeleton class="hidden h-96 w-full rounded-2xl lg:block" />
	</div>
</div>
