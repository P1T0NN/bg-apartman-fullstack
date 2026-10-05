<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<span
	class="truncate rounded bg-destructive px-1 py-1.5 text-[10px] font-medium text-white sm:text-xs"
	title={m['MyAccommodationPage.MyAccommodationCalendarBlockedDay.ownerStay']()}
>
	<span class="hidden sm:inline">
		{m['MyAccommodationPage.MyAccommodationCalendarBlockedDay.ownerStay']()}
	</span>
	<span
		class="mx-auto icon-[lucide--lock-keyhole] block size-3.5 sm:hidden"
		aria-hidden="true"
	></span>
</span>
