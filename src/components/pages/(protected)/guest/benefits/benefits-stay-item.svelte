<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '@convex/_generated/api';

	let {
		stay
	}: {
		stay: FunctionReturnType<
			typeof api.tables.bookings.queries.fetchMyBookings.fetchMyBookings
		>['items'][number];
	} = $props();
</script>

<div class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
	<div class="flex min-w-0 flex-col gap-1">
		<p class="text-sm font-medium wrap-anywhere">
			{stay.accommodation?.name ?? m['BenefitsPage.BenefitsStayItem.unavailable']()}
		</p>
		{#if stay.accommodation}
			<p class="text-xs leading-5 text-muted-foreground">{stay.accommodation.city}</p>
		{/if}
		<p class="text-xs leading-5 text-muted-foreground">
			<time datetime={stay.checkInDate}>
				{formatDate(Date.parse(stay.checkInDate), getLocale())}
			</time>
			–
			<time datetime={stay.checkOutDate}>
				{formatDate(Date.parse(stay.checkOutDate), getLocale())}
			</time>
		</p>
	</div>
	<p class="flex shrink-0 items-center gap-1.5 text-xs font-medium">
		<span class="icon-[lucide--circle-check] size-4 text-success" aria-hidden="true"></span>
		{m['BenefitsPage.BenefitsStayItem.completed']()}
	</p>
</div>
