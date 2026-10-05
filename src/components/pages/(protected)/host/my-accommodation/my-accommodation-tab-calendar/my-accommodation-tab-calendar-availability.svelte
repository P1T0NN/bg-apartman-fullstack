<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<section class="flex flex-col gap-4" aria-labelledby="availability-rules-title">
	<div>
		<h3 id="availability-rules-title" class="text-lg font-semibold">
			{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.rules']()}
		</h3>
		<p class="mt-1 text-sm text-muted-foreground">
			{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.rulesHint']()}
		</p>
	</div>
	<dl class="grid gap-5 rounded-xl border p-5 sm:grid-cols-2 xl:grid-cols-4">
		<div>
			<dt class="text-sm text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.stayLength']()}
			</dt>
			<dd class="mt-1 font-medium">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.stayValue']()}
			</dd>
		</div>
		<div>
			<dt class="text-sm text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.advanceNotice']()}
			</dt>
			<dd class="mt-1 font-medium">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.noticeValue']()}
			</dd>
		</div>
		<div>
			<dt class="text-sm text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.preparation']()}
			</dt>
			<dd class="mt-1 font-medium">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.preparationValue']()}
			</dd>
		</div>
		<div>
			<dt class="text-sm text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.bookingWindow']()}
			</dt>
			<dd class="mt-1 font-medium">
				{m['MyAccommodationPage.MyAccommodationTabCalendarAvailability.windowValue']()}
			</dd>
		</div>
	</dl>
</section>
