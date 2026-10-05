<script lang="ts">
	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// DATA
	import { BOOKING_SORTS } from '@/shared/features/bookings/data/bookingsData.js';

	// TYPES
	import type { BookingSort } from '@/shared/features/bookings/types/bookingTypes.js';

	let {
		value,
		onSortChange,
		disabled = false
	}: {
		value: BookingSort;
		onSortChange: (value: BookingSort) => void;
		disabled?: boolean;
	} = $props();

	function handleChange(next: string): void {
		const sort = BOOKING_SORTS.find((option) => option === next);
		if (sort) onSortChange(sort);
	}
</script>

<NativeSelect
	label={m['BookingsFeature.BookingSortSelect.label']()}
	options={[
		{ value: 'newest', label: m['BookingsFeature.BookingSortSelect.newest']() },
		{ value: 'oldest', label: m['BookingsFeature.BookingSortSelect.oldest']() }
	]}
	{value}
	{disabled}
	onchange={handleChange}
	includePlaceholderOption={false}
/>
