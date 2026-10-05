<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import MyAccommodationTabListingLoading from './my-accommodation-tab-listing-loading.svelte';
</script>

<div class="flex flex-col gap-7" aria-busy="true">
	<div class="flex flex-col gap-5" aria-hidden="true">
		<Skeleton class="h-4 w-40" />
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex flex-col gap-2">
				<Skeleton class="h-8 w-64 max-w-full" />
				<Skeleton class="h-4 w-40" />
			</div>
			<Skeleton class="h-9 w-32" />
		</div>
	</div>
	<div class="flex gap-8 border-b pb-3" aria-hidden="true">
		<Skeleton class="h-6 w-16" />
		<Skeleton class="h-6 w-20" />
		<Skeleton class="h-6 w-16" />
	</div>
	<MyAccommodationTabListingLoading />
</div>
