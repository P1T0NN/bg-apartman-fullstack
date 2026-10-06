<script lang="ts">
	// COMPONENTS
	import BookSummaryPricing from './book-summary-pricing.svelte';
	import BookCheckoutConfirmButton from '../book-checkout/book-checkout-confirm-button.svelte';
	import * as Card from '@/components/ui/card/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PublicAccommodation } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		accommodation,
		checkInDate,
		checkOutDate,
		guests,
		submitting,
		onBook
	}: {
		accommodation: PublicAccommodation;
		checkInDate: string;
		checkOutDate: string;
		guests: number;
		submitting: boolean;
		onBook: () => Promise<void>;
	} = $props();
</script>

<aside aria-labelledby="book-summary-title" class="min-w-0 lg:sticky lg:top-24">
	<Card.Root class="rounded-2xl shadow-sm">
		<Card.Header>
			<Card.Title>
				<h2 id="book-summary-title">{m['BookingPage.BookSummary.title']()}</h2>
			</Card.Title>
		</Card.Header>

		<Card.Content class="flex flex-col gap-6">
			<div class="flex items-center gap-4">
				{#if accommodation.imageUrls[0]}
					<img
						src={accommodation.imageUrls[0]}
						alt=""
						class="size-16 shrink-0 rounded-xl object-cover"
					/>
				{/if}

				<div class="min-w-0">
					<p class="font-semibold wrap-anywhere">{accommodation.name}</p>
					<p class="mt-1 text-sm text-muted-foreground">
						{accommodation.address.city}, {accommodation.address.country}
					</p>
				</div>
			</div>

			<BookSummaryPricing {accommodation} {checkInDate} {checkOutDate} {guests} />
		</Card.Content>

		<Card.Footer class="flex-col items-stretch gap-3">
			<BookCheckoutConfirmButton
				{submitting}
				mode={accommodation.bookingMode}
				onclick={onBook}
				class="mt-0 w-full sm:w-full"
			/>
		</Card.Footer>
	</Card.Root>
</aside>
