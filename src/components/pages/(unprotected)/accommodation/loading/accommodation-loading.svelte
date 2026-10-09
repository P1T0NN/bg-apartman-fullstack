<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-busy="true" class="flex flex-col gap-6 pb-8">
	<Skeleton class="h-5 w-32" />
	<Skeleton class="h-6 w-28" />
	<Skeleton class="h-10 w-3/4" />
	<Skeleton class="h-72 w-full rounded-2xl sm:h-96 lg:h-120" />
	<Skeleton class="h-12 w-full" />
	<div class="flex flex-col gap-8 lg:flex-row lg:gap-16">
		<div class="flex min-w-0 flex-1 flex-col gap-6">
			<Skeleton class="h-8 w-48" />
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Skeleton class="h-24 w-full" />
				<Skeleton class="h-24 w-full" />
				<Skeleton class="h-24 w-full" />
				<Skeleton class="h-24 w-full" />
			</div>
			<Skeleton class="h-40 w-full" />
		</div>
		<Skeleton class="hidden h-64 w-88 shrink-0 lg:block" />
	</div>
</div>
