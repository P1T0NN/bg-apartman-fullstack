<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// CONFIG
	import { ACCOMMODATION_CONFIG } from '@/shared/features/accommodations/config.js';

	// UTILS
	import { DAY_IN_MS, formatDate } from '@/shared/utils/date.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { Id } from '@convex/_generated/dataModel';

	let {
		value = $bindable(),
		accommodationId,
		timeZone,
		disabled = false,
		pending = $bindable(false)
	}: {
		value: DateRange;
		accommodationId: Id<'accommodations'>;
		timeZone: string;
		disabled?: boolean;
		pending?: boolean;
	} = $props();
	const blockDates = useMutation(
		api.tables.accommodationBlockedDates.mutations.blockDates.blockDates
	);
	const unblockDates = useMutation(
		api.tables.accommodationBlockedDates.mutations.unblockDates.unblockDates
	);
	const last = $derived(value.end ?? value.start);
	const count = $derived(
		value.start && last
			? (Date.parse(last.toString()) - Date.parse(value.start.toString())) / DAY_IN_MS + 1
			: 0
	);
	const tooLong = $derived(count > ACCOMMODATION_CONFIG.MAX_BLOCKED_DATES_PER_OPERATION);
	async function save(blocked: boolean): Promise<void> {
		const cannotSave = !value.start || !last || disabled || pending || tooLong || count < 1;
		if (cannotSave || !value.start || !last) return;
		pending = true;
		try {
			const result = await (blocked ? blockDates : unblockDates)({
				accommodationId,
				startDate: value.start.toString(),
				lastDate: last.toString()
			});
			value = { start: undefined, end: undefined };
			const message = blocked
				? m['MyAccommodationPage.MyAccommodationTabSelectedDates.blockedSuccess']()
				: m['MyAccommodationPage.MyAccommodationTabSelectedDates.unblockedSuccess']();
			toastMessage({
				type: 'success',
				message: result.pendingRequests
					? `${message} ${m['MyAccommodationPage.MyAccommodationTabSelectedDates.pendingWarning']({ count: result.pendingRequests })}`
					: message
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}

	const selectedDates = $derived(
		value.start
			? [value.start, value.end]
					.filter((date) => date !== undefined)
					.map((date) => formatDate(date.toDate('UTC').getTime(), getLocale()))
					.join(' – ')
			: m['MyAccommodationPage.MyAccommodationTabSelectedDates.selected']()
	);
</script>

<aside
	class="flex flex-col gap-5 rounded-xl border p-5"
	aria-labelledby="selected-dates-title"
	aria-busy={pending}
>
	<div class="flex flex-col gap-2">
		<h3 id="selected-dates-title" class="text-lg font-semibold">
			{selectedDates}
		</h3>

		<p class="text-sm text-muted-foreground">
			{m['MyAccommodationPage.MyAccommodationTabSelectedDates.rangeHint']()}
		</p>
		<p class="text-xs text-muted-foreground">
			{m['MyAccommodationPage.MyAccommodationTabSelectedDates.timeZone']({ timeZone })}
		</p>
		{#if count > 0}
			<p class="text-sm font-medium">
				{m['MyAccommodationPage.MyAccommodationTabSelectedDates.nights']({ count })}
			</p>
		{/if}
		{#if tooLong}
			<p role="alert" class="text-sm text-destructive">
				{m['BackendMessages.invalidBlockedDateRange']()}
			</p>
		{/if}
	</div>
	<Button
		type="button"
		disabled={disabled || pending || count < 1 || tooLong}
		onclick={() => void save(true)}
	>
		{#if pending}
			<Spinner />
		{:else}
			<span class="icon-[lucide--calendar-off]" data-icon="inline-start" aria-hidden="true"></span>
		{/if}
		{m['MyAccommodationPage.MyAccommodationTabCalendarHeader.blockDates']()}
	</Button>
	<Button
		type="button"
		variant="outline"
		disabled={disabled || pending || count < 1 || tooLong}
		onclick={() => void save(false)}
	>
		<span class="icon-[lucide--calendar-check]" data-icon="inline-start" aria-hidden="true"></span>
		{m['MyAccommodationPage.MyAccommodationTabSelectedDates.unblockDates']()}
	</Button>
	<p class="text-xs leading-5 text-muted-foreground">
		{m['MyAccommodationPage.MyAccommodationTabSelectedDates.pendingHint']()}
	</p>
</aside>
