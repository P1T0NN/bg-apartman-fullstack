<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<div role="status" aria-busy="true" class="flex flex-col gap-6 py-8">
	<span class="sr-only">{m['AccommodationPage.loading']()}</span>
	<Skeleton class="h-5 w-32" />
	<Skeleton class="h-10 w-3/4" />
	<Skeleton class="h-72 w-full rounded-2xl sm:h-96 lg:h-[30rem]" />
	<div class="grid gap-8 lg:grid-cols-[1fr_22rem]">
		<Skeleton class="h-56 w-full" />
		<Skeleton class="h-64 w-full" />
	</div>
</div>
