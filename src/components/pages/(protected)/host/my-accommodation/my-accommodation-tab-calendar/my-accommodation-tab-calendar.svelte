<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Badge } from '@/components/ui/badge/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import CalendarDay from './my-accommodation-calendar-day-item.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// October 2026 is a fixed example, with Monday as the first column.
	const weeks = Array.from({ length: 5 }, (_, week) =>
		Array.from({ length: 7 }, (_, column) => week * 7 + column - 2)
	);
	const weekdays = $derived(
		Array.from({ length: 7 }, (_, day) =>
			new Intl.DateTimeFormat(getLocale(), { weekday: 'short', timeZone: 'UTC' }).format(
				new Date(Date.UTC(2026, 9, 5 + day))
			)
		)
	);
	const month = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(Date.UTC(2026, 9, 1)))
	);
</script>

<div class="flex flex-col gap-8">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div class="flex flex-col gap-1">
			<h2 class="text-xl font-semibold">
				{m['MyAccommodationPage.MyAccommodationTabCalendar.title']()}
			</h2>
			<p class="max-w-prose text-sm text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabCalendar.description']()}
			</p>
		</div>
		<Button disabled
			><span class="icon-[lucide--calendar-off]" data-icon="inline-start" aria-hidden="true"
			></span>{m['MyAccommodationPage.MyAccommodationTabCalendar.blockDates']()}</Button
		>
	</div>
	<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
		<div class="min-w-0 overflow-hidden rounded-xl border">
			<div class="flex items-center justify-between gap-3 border-b p-4 sm:px-5">
				<h3 class="text-lg font-semibold">{month}</h3>
				<div class="flex items-center gap-1">
					<Button variant="outline" size="sm" disabled
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.today']()}</Button
					>
					<Button
						variant="ghost"
						size="icon"
						disabled
						aria-label={m['MyAccommodationPage.MyAccommodationTabCalendar.previousMonth']()}
						><span class="icon-[lucide--chevron-left]" aria-hidden="true"></span></Button
					>
					<Button
						variant="ghost"
						size="icon"
						disabled
						aria-label={m['MyAccommodationPage.MyAccommodationTabCalendar.nextMonth']()}
						><span class="icon-[lucide--chevron-right]" aria-hidden="true"></span></Button
					>
				</div>
			</div>
			<table class="w-full table-fixed border-collapse">
				<caption class="sr-only"
					>{m['MyAccommodationPage.MyAccommodationTabCalendar.caption']({ month })}</caption
				>
				<thead
					><tr
						>{#each weekdays as weekday (weekday)}<th
								scope="col"
								class="border-b bg-muted/30 py-3 text-xs font-medium text-muted-foreground"
								>{weekday}</th
							>{/each}</tr
					></thead
				>
				<tbody>
					{#each weeks as week, index (index)}
						<tr
							>{#each week as day (day)}{#if day >= 1 && day <= 31}<CalendarDay {day} />{:else}<td
										class="border-r border-b bg-muted/25 last:border-r-0"
									></td>{/if}{/each}</tr
						>
					{/each}
				</tbody>
			</table>
			<div class="flex flex-wrap gap-x-5 gap-y-2 px-4 py-4 text-xs text-muted-foreground">
				<span class="flex items-center gap-2"
					><span class="size-2.5 rounded-sm border" aria-hidden="true"></span>{m[
						'MyAccommodationPage.MyAccommodationTabCalendar.available'
					]()}</span
				>
				<span class="flex items-center gap-2"
					><span class="size-2.5 rounded-sm bg-primary" aria-hidden="true"></span>{m[
						'MyAccommodationPage.MyAccommodationTabCalendar.booked'
					]()}</span
				>
				<span class="flex items-center gap-2"
					><span
						class="size-2.5 rounded-sm border border-primary/25 bg-primary/10"
						aria-hidden="true"
					></span>{m['MyAccommodationPage.MyAccommodationTabCalendar.imported']()}</span
				>
				<span class="flex items-center gap-2"
					><span class="size-2.5 rounded-sm border bg-muted" aria-hidden="true"></span>{m[
						'MyAccommodationPage.MyAccommodationTabCalendar.blocked'
					]()}</span
				>
			</div>
		</div>
		<aside class="flex flex-col gap-5 rounded-xl border p-5" aria-labelledby="selected-dates-title">
			<div class="flex flex-col gap-2">
				<Badge variant="outline"
					>{m['MyAccommodationPage.MyAccommodationTabCalendar.selected']()}</Badge
				>
				<h3 id="selected-dates-title" class="text-lg font-semibold">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.exampleRange']()}
				</h3>
				<p class="text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.rangeHint']()}
				</p>
			</div>
			<Field.Group>
				<Field.Field
					><Field.Label for="calendar-status"
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.availability']()}</Field.Label
					><select
						id="calendar-status"
						disabled
						class="h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
						><option>{m['MyAccommodationPage.MyAccommodationTabCalendar.blocked']()}</option
						></select
					></Field.Field
				>
				<Field.Field
					><Field.Label for="calendar-reason"
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.reason']()}</Field.Label
					><select
						id="calendar-reason"
						disabled
						class="h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
						><option>{m['MyAccommodationPage.MyAccommodationTabCalendar.maintenance']()}</option
						></select
					></Field.Field
				>
				<Field.Field
					><Field.Label for="calendar-note"
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.privateNote']()}</Field.Label
					><Textarea
						id="calendar-note"
						value={m['MyAccommodationPage.MyAccommodationTabCalendar.sampleNote']()}
						rows={2}
						disabled
					/><Field.Description
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.noteHint']()}</Field.Description
					></Field.Field
				>
				<Field.Field
					><Field.Label for="calendar-price"
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.nightlyRate']()}</Field.Label
					><Input id="calendar-price" value="85" type="number" disabled /><Field.Description
						>{m['MyAccommodationPage.MyAccommodationTabCalendar.rateHint']()}</Field.Description
					></Field.Field
				>
			</Field.Group>
			<Button disabled>{m['MyAccommodationPage.MyAccommodationTabCalendar.save']()}</Button>
		</aside>
	</div>
	<section class="flex flex-col gap-4" aria-labelledby="availability-rules-title">
		<div>
			<h3 id="availability-rules-title" class="text-lg font-semibold">
				{m['MyAccommodationPage.MyAccommodationTabCalendar.rules']()}
			</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				{m['MyAccommodationPage.MyAccommodationTabCalendar.rulesHint']()}
			</p>
		</div>
		<dl class="grid gap-5 rounded-xl border p-5 sm:grid-cols-2 xl:grid-cols-4">
			<div>
				<dt class="text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.stayLength']()}
				</dt>
				<dd class="mt-1 font-medium">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.stayValue']()}
				</dd>
			</div>
			<div>
				<dt class="text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.advanceNotice']()}
				</dt>
				<dd class="mt-1 font-medium">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.noticeValue']()}
				</dd>
			</div>
			<div>
				<dt class="text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.preparation']()}
				</dt>
				<dd class="mt-1 font-medium">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.preparationValue']()}
				</dd>
			</div>
			<div>
				<dt class="text-sm text-muted-foreground">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.bookingWindow']()}
				</dt>
				<dd class="mt-1 font-medium">
					{m['MyAccommodationPage.MyAccommodationTabCalendar.windowValue']()}
				</dd>
			</div>
		</dl>
	</section>
</div>
