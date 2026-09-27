<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { getLocalTimeZone } from '@internationalized/date';

	// COMPONENTS
	import SearchCardGuests from './search-card-guests.svelte';
	import SearchCardStayDates from './search-card-stay-dates.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import GoogleLocationSearchInput from '@/components/ui/custom-components/google-components/google-location-search-input/google-location-search-input.svelte';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';

	// HOOKS
	import { useSearchParams } from '@/hooks/useSearchParams.svelte.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// SCHEMAS
	import { searchLocationSchema } from '@/shared/features/search/schemas/searchSchemas.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { parseIsoDate, toIsoDate } from '@/shared/utils/date.js';
	import { toastMessage } from '@/utils/toastMessage.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';

	let {
		compact = false,
		inlineSearch = false,
		initialLocation = '',
		onopen,
		onsearch
	}: {
		compact?: boolean;
		inlineSearch?: boolean;
		initialLocation?: string;
		onopen?: () => void;
		onsearch?: () => void;
	} = $props();

	const SEARCH_PARAM_KEYS = ['location', 'checkIn', 'checkOut', 'adults', 'children', 'rooms'];

	const uid = $props.id();
	const locationId = `home-location-${uid}`;
	const locationErrorId = `${locationId}-error`;

	const searchParams = useSearchParams(SEARCH_PARAM_KEYS);

	function readGuestCount(key: 'adults' | 'children' | 'rooms', fallback: number): number {
		const parsed = Number.parseInt(searchParams.read(key), 10);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	const initialPlaceId = searchParams.read('location');
	const initialCheckIn = parseIsoDate(searchParams.read('checkIn'));
	const initialCheckOut = parseIsoDate(searchParams.read('checkOut'));

	// svelte-ignore state_referenced_locally
	let location = $state(initialLocation);
	let place = $state<{ placeId: string } | null>(
		initialPlaceId ? { placeId: initialPlaceId } : null
	);
	let dateRange = $state<DateRange | undefined>(
		initialCheckIn || initialCheckOut ? { start: initialCheckIn, end: initialCheckOut } : undefined
	);
	let guests = $state({
		adults: readGuestCount('adults', 2),
		children: readGuestCount('children', 0),
		rooms: readGuestCount('rooms', 1)
	});
	let submitAttempted = $state(false);

	const locationValidation = $derived(searchLocationSchema.safeParse(place));
	const locationError = $derived.by(() => {
		if (!submitAttempted || locationValidation.success) return null;
		if (location.trim() && !place) return m['ValidationMessages.invalidSelection']();
		return locationValidation.error.issues[0].message;
	});

	const compactDatesLabel = $derived.by(() => {
		const start = dateRange?.start;
		const end = dateRange?.end;
		if (!start) return m['Components.SearchCardStayDates.selectDates']();

		const formatter = new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric' });
		const startLabel = formatter.format(start.toDate(getLocalTimeZone()));
		if (!end) return startLabel;

		return `${startLabel} - ${formatter.format(end.toDate(getLocalTimeZone()))}`;
	});

	const searchUrl = $derived(
		searchParams.href(UNPROTECTED_PAGE_ENDPOINTS.SEARCH, {
			location: place?.placeId ?? '',
			checkIn: dateRange?.start ? toIsoDate(dateRange.start) : '',
			checkOut: dateRange?.end ? toIsoDate(dateRange.end) : '',
			adults: String(guests.adults),
			children: guests.children > 0 ? String(guests.children) : '',
			rooms: String(guests.rooms)
		})
	);

	function handleSearch(): void {
		submitAttempted = true;

		if (!locationValidation.success) {
			toastMessage({
				type: 'error',
				error: new Error('Invalid home search location'),
				message: locationError ?? locationValidation.error.issues[0].message
			});
			return;
		}

		onsearch?.();

		// eslint-disable-next-line svelte/no-navigation-without-resolve -- searchUrl is built from the resolved endpoint
		goto(searchUrl);
	}
</script>

{#if compact}
	<button
		type="button"
		onclick={onopen}
		class="flex w-full min-w-0 cursor-pointer items-center rounded-full border bg-background text-left shadow-sm min-[68.75rem]:max-w-2xl"
	>
		<span class="min-w-0 flex-1 truncate px-4 py-2 text-sm font-medium">
			{location || m['Components.SearchCard.locationPlaceholder']()}
		</span>
		<span class="hidden shrink-0 border-s px-4 py-2 text-sm text-muted-foreground sm:block">
			{compactDatesLabel}
		</span>
		<span
			class="hidden shrink-0 items-center gap-1.5 border-s px-4 py-2 text-sm text-muted-foreground sm:flex"
		>
			<Plural
				count={guests.adults}
				forms={{
					one: m['Components.SearchCardGuests.adult'](),
					other: m['Components.SearchCardGuests.adults']()
				}}
			/>
			{#if guests.children > 0}
				<span aria-hidden="true">-</span>
				<Plural
					count={guests.children}
					forms={{
						one: m['Components.SearchCardGuests.child'](),
						other: m['Components.SearchCardGuests.children']()
					}}
				/>
			{/if}
			{#if guests.rooms > 0}
				<span aria-hidden="true">-</span>
				<Plural
					count={guests.rooms}
					forms={{
						one: m['Components.SearchCardGuests.room'](),
						other: m['Components.SearchCardGuests.rooms']()
					}}
				/>
			{/if}
		</span>
		<span
			class="me-1.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
		>
			<span class="icon-[lucide--search] size-4" aria-hidden="true"></span>
		</span>
		<span class="sr-only">{m['Components.SearchCard.openSearch']()}</span>
	</button>
{:else}
	<Card.Root class="overflow-visible">
		<Card.Content>
			<div
				class={cn(
					'grid gap-5 sm:grid-cols-2',
					inlineSearch ? 'lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end' : 'lg:grid-cols-3'
				)}
			>
				<Field.Field data-invalid={Boolean(locationError)}>
					<Field.Label for={locationId}>{m['Components.SearchCard.location']()}</Field.Label>
					<GoogleLocationSearchInput
						id={locationId}
						bind:value={location}
						bind:place
						placeholder={m['Components.SearchCard.locationPlaceholder']()}
						aria-invalid={Boolean(locationError)}
						aria-describedby={locationError ? locationErrorId : undefined}
					/>
					{#if locationError}
						<Field.Error id={locationErrorId}>{locationError}</Field.Error>
					{/if}
				</Field.Field>

				<SearchCardStayDates bind:value={dateRange} />
				<SearchCardGuests bind:value={guests} />
				{#if inlineSearch}
					<Button class="w-full lg:w-auto" onclick={handleSearch}>
						{m['Components.SearchCard.search']()}
					</Button>
				{/if}
			</div>
		</Card.Content>

		{#if !inlineSearch}
			<Card.Footer>
				<Button class="w-full sm:ms-auto sm:w-auto" onclick={handleSearch}>
					{m['Components.SearchCard.search']()}
				</Button>
			</Card.Footer>
		{/if}
	</Card.Root>
{/if}
