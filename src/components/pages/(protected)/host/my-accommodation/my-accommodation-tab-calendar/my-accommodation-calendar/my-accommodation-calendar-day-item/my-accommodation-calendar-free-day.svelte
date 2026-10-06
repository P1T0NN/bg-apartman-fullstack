<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import {
		getNightlyPricing,
		type NightlyPricing
	} from '@/shared/features/bookings/utils/calculateStayPricing.js';
	import { formatCurrency } from '@/shared/utils/currency.js';

	// TYPES
	import type { DateValue } from '@internationalized/date';

	let { date, pricing }: { date: DateValue; pricing: NightlyPricing } = $props();
	const price = $derived(getNightlyPricing(pricing, date.toString()).effectivePricePerNightMinor);
</script>

<span class="text-[10px] text-muted-foreground tabular-nums sm:text-sm">
	{formatCurrency(price, getLocale())}
</span>
