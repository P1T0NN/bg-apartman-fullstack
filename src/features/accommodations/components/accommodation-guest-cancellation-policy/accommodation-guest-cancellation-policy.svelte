<script lang="ts">
	// COMPONENTS
	import BookingCancellationPolicy from '@/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte';

	// UTILS
	import { getZonedTimestamp } from '@/shared/features/timezone/utils/getZonedTimestamp.js';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		accommodation,
		checkInDate = '',
		amountMinor,
		currency,
		compact = false,
		currentOnly = false,
		timeline = false
	}: {
		accommodation: Pick<PublicAccommodation, 'cancellationPolicy' | 'timeZone' | 'checkInStart'>;
		checkInDate?: string;
		amountMinor?: number;
		currency?: string;
		compact?: boolean;
		currentOnly?: boolean;
		timeline?: boolean;
	} = $props();

	const checkInAt = $derived.by(() => {
		if (!checkInDate) return undefined;
		try {
			const start = accommodation.checkInStart;
			if (!start) return undefined;
			return getZonedTimestamp(checkInDate, start, accommodation.timeZone);
		} catch {
			return undefined;
		}
	});
</script>

<BookingCancellationPolicy
	policy={accommodation.cancellationPolicy}
	timeZone={accommodation.timeZone}
	{checkInAt}
	{amountMinor}
	{currency}
	{compact}
	{currentOnly}
	{timeline}
	invalidDate={Boolean(checkInDate) && checkInAt === undefined}
/>
