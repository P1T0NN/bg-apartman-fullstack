<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<div role="status" aria-busy="true" class="rounded-xl border p-5">
	<span class="sr-only">{m['BookingPage.loading']()}</span>
	<Skeleton class="h-7 w-1/2" />
	<Skeleton class="mt-4 h-5 w-3/4" />
	<Skeleton class="mt-6 h-5 w-2/3" />
	<Skeleton class="mt-3 h-5 w-1/3" />
</div>
