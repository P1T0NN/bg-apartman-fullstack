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
		compact = false,
		timeline = false
	}: {
		accommodation: Pick<PublicAccommodation, 'cancellationPolicy' | 'timeZone' | 'checkInStart'>;
		checkInDate?: string;
		compact?: boolean;
		timeline?: boolean;
	} = $props();

	const checkInAt = $derived.by(() => {
		if (!checkInDate) return undefined;
		try {
			return getZonedTimestamp(checkInDate, accommodation.checkInStart, accommodation.timeZone);
		} catch {
			return undefined;
		}
	});
</script>

<BookingCancellationPolicy
	policy={accommodation.cancellationPolicy}
	timeZone={accommodation.timeZone}
	{checkInAt}
	{compact}
	{timeline}
	invalidDate={Boolean(checkInDate) && checkInAt === undefined}
/>
