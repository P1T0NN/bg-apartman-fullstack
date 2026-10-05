<script lang="ts">
	// LIBRARIES
	import { onMount, untrack } from 'svelte';
	import { today, type DateValue } from '@internationalized/date';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import MyAccommodationTabSelectedDates from './my-accommodation-tab-selected-dates/my-accommodation-tab-selected-dates.svelte';
	import MyAccommodationTabCalendarHeader from './my-accommodation-tab-calendar-header.svelte';
	import MyAccommodationCalendar from './my-accommodation-calendar/my-accommodation-calendar.svelte';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { DateRange } from 'bits-ui';

	type AccommodationCalendar = {
		_id: Id<'accommodations'>;
		timeZone: string;
	};

	let {
		accommodation
	}: {
		accommodation: AccommodationCalendar;
	} = $props();

	let placeholder = $state<DateValue>(untrack(() => today(accommodation.timeZone)));
	let pending = $state(false);
	let timestamp = $state(Date.now());

	const minValue = $derived.by(() => {
		void timestamp;
		return today(accommodation.timeZone);
	});

	const calendar = useQuery(
		api.tables.accommodationBlockedDates.queries.fetchMyAccommodationCalendar
			.fetchMyAccommodationCalendar,
		() => ({
			accommodationId: accommodation._id
		})
	);

	const unavailable = $derived(calendar.isLoading || Boolean(calendar.error));

	onMount(() => {
		const timer = setInterval(() => {
			timestamp = Date.now();
		}, 30_000);
		return () => clearInterval(timer);
	});

	let value = $state<DateRange>({
		start: undefined,
		end: undefined
	});
</script>

<div class="flex flex-col gap-8">
	<MyAccommodationTabCalendarHeader />

	<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
		<div class="min-w-0 overflow-hidden rounded-xl border" aria-busy={calendar.isLoading}>
			<MyAccommodationCalendar
				bind:value
				bind:placeholder
				{minValue}
				disabled={pending || unavailable}
				bookings={calendar.data?.bookings ?? []}
				blockedDates={calendar.data?.blockedDates ?? []}
				availabilityLoaded={!unavailable && Boolean(calendar.data)}
			/>

			{#if calendar.error}
				<p role="alert" class="px-4 pt-4 text-sm text-destructive">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.loadError']()}
				</p>
			{:else if calendar.isLoading}
				<p role="status" class="px-4 pt-4 text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.loading']()}
				</p>
			{/if}

			<div class="flex flex-wrap gap-x-5 gap-y-2 px-4 py-4 text-xs text-muted-foreground">
				<span class="flex items-center gap-2">
					<span class="size-2.5 rounded-sm border" aria-hidden="true"></span>
					{m['MyAccommodationPage.MyAccommodationTabCalendar.available']()}
				</span>

				<span class="flex items-center gap-2">
					<span class="size-2.5 rounded-sm border bg-muted" aria-hidden="true"></span>
					{m['MyAccommodationPage.MyAccommodationTabCalendar.booked']()}
				</span>

				<span class="flex items-center gap-2">
					<span
						class="size-2.5 rounded-sm border border-destructive/30 bg-destructive/15"
						aria-hidden="true"
					></span>
					{m['MyAccommodationPage.MyAccommodationTabCalendar.blocked']()}
				</span>
			</div>
		</div>

		<MyAccommodationTabSelectedDates
			bind:value
			accommodationId={accommodation._id}
			timeZone={accommodation.timeZone}
			disabled={unavailable}
			bind:pending
		/>
	</div>
</div>
