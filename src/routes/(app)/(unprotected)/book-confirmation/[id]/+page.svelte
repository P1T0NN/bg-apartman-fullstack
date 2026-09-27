<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useCachedConvexQuery } from '@/hooks/useCachedConvexQuery.svelte.js';

	// CONVEX
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import BookingConfirmationLoading from '@/components/pages/(unprotected)/book-confirmation/loading/booking-confirmation-loading.svelte';

	// UTILS
	import { formatDate } from '@/shared/utils/date.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	const result = useCachedConvexQuery(
		api.tables.bookings.queries.fetchBookingConfirmation.fetchBookingConfirmation,
		() => ({
			// SAFETY: Convex validates the untrusted route ID before running the query.
			id: page.params.id as Id<'bookings'>
		})
	);
	const confirmation = $derived(result.data);
</script>

<SvelteHead title={m['BookingPage.BookingCheckout.booked']()} noindex />

<main class="mx-auto w-full max-w-3xl px-4 py-10 pb-12 sm:px-6 lg:px-8">
	{#if result.error}
		<ErrorComponent message={m['ErrorMessages.loadFailed']()} />
	{:else if result.isLoading}
		<BookingConfirmationLoading />
	{:else if confirmation}
		<div class="rounded-xl border bg-muted/30 p-5 wrap-anywhere">
			<h1 class="text-lg font-semibold">{m['BookingPage.BookingCheckout.booked']()}</h1>
			<p class="mt-3 text-sm leading-6 text-muted-foreground">
				{m['BookingPage.BookingConfirmation.bookedHint']()}
			</p>
			<dl class="mt-4 flex flex-col gap-3 text-sm">
				<div>
					<dt class="text-muted-foreground">{m['BookingPage.BookingConfirmation.stay']()}</dt>
					<dd class="mt-1 font-medium">
						<a
							class="underline underline-offset-4 hover:text-primary"
							href={UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION(confirmation.accommodationId)}
						>
							{confirmation.accommodationName}
						</a>
					</dd>
				</div>
				<div>
					<dt class="text-muted-foreground">{m['BookingPage.BookingConfirmation.dates']()}</dt>
					<dd class="mt-1">
						{formatDate(Date.parse(confirmation.checkInDate), getLocale())} – {formatDate(
							Date.parse(confirmation.checkOutDate),
							getLocale()
						)}
					</dd>
				</div>
				<div>
					<dt class="text-muted-foreground">{m['BookingPage.BookingSummary.guests']()}</dt>
					<dd class="mt-1">{confirmation.adults + confirmation.children}</dd>
				</div>
			</dl>
		</div>
	{:else}
		<EmptyData
			title={m['BookingPage.BookingConfirmation.notFound']()}
			description={m['BookingPage.BookingConfirmation.notFoundHint']()}
		/>
	{/if}
</main>
