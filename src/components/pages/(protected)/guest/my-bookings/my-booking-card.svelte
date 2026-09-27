<script lang="ts">
	// CONVEX
	import type { Doc } from '@convex/_generated/dataModel';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge';
	import * as Card from '@/components/ui/card/index.js';
	import Plural from '@/components/ui/custom-components/plural/plural.svelte';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { DAY_IN_MS, formatDate } from '@/shared/utils/date.js';

	let { booking }: { booking: Doc<'bookings'> } = $props();

	const guestName = $derived(`${booking.firstName} ${booking.lastName}`.trim());
	const nights = $derived(
		Math.max(
			1,
			Math.round((Date.parse(booking.checkOutDate) - Date.parse(booking.checkInDate)) / DAY_IN_MS)
		)
	);
</script>

<Card.Root class="h-full">
	<Card.Content class="flex flex-1 flex-col gap-4">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<Card.Title class="min-w-0 truncate">{guestName}</Card.Title>
			<Badge variant="secondary">
				<Plural
					count={nights}
					forms={{
						one: m['MyBookingsPage.MyBookingCard.night'](),
						other: m['MyBookingsPage.MyBookingCard.nights']()
					}}
					locale={getLocale()}
				/>
			</Badge>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-3xl bg-muted/50 p-3">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{m['MyBookingsPage.MyBookingCard.checkIn']()}
				</p>
				<p class="font-medium">{formatDate(Date.parse(booking.checkInDate), getLocale())}</p>
			</div>
			<div class="rounded-3xl bg-muted/50 p-3">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{m['MyBookingsPage.MyBookingCard.checkOut']()}
				</p>
				<p class="font-medium">{formatDate(Date.parse(booking.checkOutDate), getLocale())}</p>
			</div>
		</div>

		<ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
			<li class="inline-flex min-w-0 items-center gap-1.5">
				<span class="icon-[lucide--mail] size-4 shrink-0" aria-hidden="true"></span>
				<span class="truncate">{booking.email}</span>
			</li>
			<li class="inline-flex items-center gap-1.5">
				<span class="icon-[lucide--phone] size-4" aria-hidden="true"></span>
				{booking.phone}
			</li>
		</ul>

		{#if booking.specialRequests}
			<div class="rounded-3xl border bg-muted/30 p-3">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{m['MyBookingsPage.MyBookingCard.requests']()}
				</p>
				<p class="text-sm">{booking.specialRequests}</p>
			</div>
		{/if}

		<p class="mt-auto text-xs text-muted-foreground">
			{m['MyBookingsPage.MyBookingCard.booked']({
				date: formatDate(booking._creationTime, getLocale())
			})}
		</p>
	</Card.Content>
</Card.Root>
