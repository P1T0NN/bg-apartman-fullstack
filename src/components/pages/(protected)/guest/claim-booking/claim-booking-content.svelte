<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONFIG
	import {
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/constants/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import BookingStatusBadge from '@/features/bookings/components/booking-status-badge/booking-status-badge.svelte';
	import ClaimBookingContentLoading from './loading/claim-booking-content-loading.svelte';

	// HOOKS
	import { useClaimBooking } from '@/features/bookings/hooks/useClaimBooking.svelte.js';

	// UTILS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';
	import { toastMessage } from '@/utils/toastMessage.js';
	import { getBackendErrorMessage } from '@/utils/getBackendErrorMessage.js';
	import { formatDate } from '@/shared/utils/date.js';

	const claim = useClaimBooking();
	const result = useQuery(
		api.tables.bookings.queries.fetchBookingToClaim.fetchBookingToClaim,
		() => claim.args ?? 'skip'
	);

	const waitingForBooking = $derived(!claim.ready || (claim.args !== null && result.isLoading));

	async function handleClaimBooking() {
		try {
			const added = await claim.submit();

			if (!added) return;

			toastMessage({ type: 'success', message: m['ClaimBookingPage.ClaimBookingContent.added']() });

			await gotoParaglide(PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS);
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		}
	}

	async function recover() {
		claim.clear();
		await gotoParaglide(UNPROTECTED_PAGE_ENDPOINTS.FIND_BOOKING);
	}
</script>

{#if claim.args}
	<div class="flex justify-end border-b pb-6">
		<Button
			type="button"
			variant="outline"
			class="min-h-11 w-full sm:w-auto"
			disabled={claim.submitting}
			onclick={recover}
		>
			{m['ClaimBookingPage.ClaimBookingContent.findBooking']()}
		</Button>
	</div>
{/if}

{#if waitingForBooking}
	<ClaimBookingContentLoading />
{:else if !claim.args}
	<EmptyData
		title={m['ClaimBookingPage.ClaimBookingContent.noBookingTitle']()}
		description={m['ClaimBookingPage.ClaimBookingContent.noBookingDescription']()}
		action={{ label: m['ClaimBookingPage.ClaimBookingContent.findBooking'](), onclick: recover }}
		card
	/>
{:else if result.error}
	<ErrorComponent
		message={getBackendErrorMessage(result.error) ?? m['ErrorMessages.loadFailed']()}
	/>
{:else if result.data}
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold wrap-anywhere">{result.data.accommodationName}</h2>
		<div class="flex flex-wrap items-center gap-3">
			<BookingStatusBadge status={result.data.status} />

			<p class="text-sm">
				{m['ClaimBookingPage.ClaimBookingContent.stay']({
					checkIn: formatDate(Date.parse(result.data.checkInDate), getLocale()),
					checkOut: formatDate(Date.parse(result.data.checkOutDate), getLocale())
				})}
			</p>
		</div>

		<p class="text-sm wrap-anywhere text-muted-foreground">{result.data.email}</p>

		{#if result.data.isClaimable}
			<Button
				type="button"
				disabled={claim.submitting}
				aria-busy={claim.submitting}
				class="min-h-11 w-full sm:w-fit"
				onclick={handleClaimBooking}
			>
				{claim.submitting
					? m['ClaimBookingPage.ClaimBookingContent.adding']()
					: m['ClaimBookingPage.ClaimBookingContent.confirm']()}
			</Button>
		{:else}
			<p role="status" class="text-sm text-success">
				{m['ClaimBookingPage.ClaimBookingContent.alreadyAdded']()}
			</p>

			<Button href={PROTECTED_PAGE_ENDPOINTS.MY_BOOKINGS} class="min-h-11 w-fit">
				{m['ClaimBookingPage.ClaimBookingContent.myBookings']()}
			</Button>
		{/if}
	</div>
{/if}
