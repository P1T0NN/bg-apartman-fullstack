<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div
	role="status"
	aria-label={m['ClaimBookingPage.ClaimBookingContentLoading.loading']()}
	class="flex flex-col gap-4"
>
	<Skeleton class="h-7 w-2/3" />
	<Skeleton class="h-20 w-full" />
	<Skeleton class="h-11 w-40" />
</div>
