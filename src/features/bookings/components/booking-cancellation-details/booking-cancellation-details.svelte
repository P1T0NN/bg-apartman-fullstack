<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// UTILS
	import { formatZonedDateTime } from '@/shared/features/timezone/utils/formatZonedDateTime.js';

	// TYPES
	import type { BookingCancellation } from '@/shared/features/bookings/types/bookingTypes.js';

	let { cancellation, timeZone }: { cancellation: BookingCancellation; timeZone: string } =
		$props();
</script>

<section class="flex min-w-0 flex-col gap-2 text-sm">
	<h3 class="font-semibold">
		{cancellation.kind === 'withdrawal'
			? m['BookingsFeature.BookingCancellationDetails.withdrawn']()
			: m['BookingsFeature.BookingCancellationDetails.cancelled']()}
	</h3>
	<p class="text-muted-foreground">
		{formatZonedDateTime(cancellation.cancelledAt, getLocale(), timeZone)}
	</p>
	<p class="wrap-anywhere whitespace-pre-line">{cancellation.reason}</p>
	{#if cancellation.refundPercentage !== null}
		<p>
			{m['BookingsFeature.BookingCancellationDetails.refund']({
				percentage: cancellation.refundPercentage
			})}
		</p>
	{/if}
	<p class="text-muted-foreground">{m['BookingsFeature.BookingCancellationDetails.noPayment']()}</p>
</section>
