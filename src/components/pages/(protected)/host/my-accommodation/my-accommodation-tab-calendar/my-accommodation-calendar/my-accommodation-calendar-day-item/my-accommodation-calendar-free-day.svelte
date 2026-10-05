<script lang="ts">
	// LIBRARIES
	import { getLocale } from '@/lib/paraglide/runtime';

	// UTILS
	import { formatCurrency } from '@/shared/utils/currency.js';

	// TYPES
	import type { DateValue } from '@internationalized/date';

	let { date }: { date: DateValue } = $props();
	const sampleMonth = $derived(date.year === 2026 && date.month === 10);
</script>

<span class="text-[10px] text-muted-foreground tabular-nums sm:text-sm">
	{sampleMonth ? formatCurrency(8500, getLocale()) : ''}
</span>
