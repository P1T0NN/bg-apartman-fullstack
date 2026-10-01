<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div
	role="status"
	aria-label={m['FindBookingPage.FindBookingDetailsLoading.loading']()}
	class="flex flex-col gap-5 rounded-4xl bg-card p-5 ring-1 ring-foreground/5 sm:px-6"
>
	<div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
		<Skeleton class="h-6 w-3/4 sm:w-1/2" />
		<Skeleton class="h-5 w-24" />
	</div>
	<div class="grid grid-cols-2 gap-5 border-t pt-5 sm:grid-cols-3 sm:gap-6">
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-16" />
			<Skeleton class="h-5 w-24" />
		</div>
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-16" />
			<Skeleton class="h-5 w-24" />
		</div>
		<div class="col-span-2 flex flex-col gap-2 sm:col-span-1">
			<Skeleton class="h-4 w-16" />
			<Skeleton class="h-5 w-24" />
		</div>
	</div>
	<Skeleton class="h-11 w-full sm:w-28" />
</div>
