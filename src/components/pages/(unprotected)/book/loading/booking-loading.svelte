<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div role="status" aria-busy="true" class="grid gap-8 py-6 lg:grid-cols-[1fr_23rem]">
	<div class="flex flex-col gap-5">
		<Skeleton class="h-8 w-2/3" /><Skeleton class="h-40 w-full" /><Skeleton
			class="h-8 w-1/2"
		/><Skeleton class="h-56 w-full" />
	</div>
	<Skeleton class="h-96 w-full rounded-2xl" />
</div>
