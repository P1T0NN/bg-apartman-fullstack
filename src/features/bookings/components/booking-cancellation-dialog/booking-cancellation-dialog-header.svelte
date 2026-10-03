<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// UTILS
	import { formatZonedDateTime } from '@/shared/features/timezone/utils/formatZonedDateTime.js';

	// TYPES
	import type { BookingCancellationTerms } from '@/shared/features/bookings/types/bookingTypes.js';

	let {
		titleId,
		isWithdrawal,
		accommodationName,
		cancellationTerms
	}: {
		titleId: string;
		isWithdrawal: boolean;
		accommodationName: string;
		cancellationTerms: Pick<BookingCancellationTerms, 'checkInAt' | 'timeZone'>;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<h2 id={titleId} class="text-lg font-semibold">
		{isWithdrawal
			? m['BookingsFeature.BookingCancellationDialogHeader.withdraw']()
			: m['BookingsFeature.BookingCancellationDialogHeader.cancel']()}
	</h2>
	<p class="font-medium wrap-anywhere">{accommodationName}</p>
	<p class="text-sm text-muted-foreground">
		{isWithdrawal
			? m['BookingsFeature.BookingCancellationDialogHeader.withdrawDescription']()
			: m['BookingsFeature.BookingCancellationDialogHeader.cancelDescription']()}
	</p>
	<p class="text-sm">
		{m['BookingsFeature.BookingCancellationDialogHeader.checkIn']({
			date: formatZonedDateTime(
				cancellationTerms.checkInAt,
				getLocale(),
				cancellationTerms.timeZone
			),
			timeZone: cancellationTerms.timeZone
		})}
	</p>
</div>
