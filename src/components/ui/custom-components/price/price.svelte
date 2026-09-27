<script lang="ts">
	// Price: formats a stored minor-unit amount for the visitor's locale and the
	// amount's own currency, so callers never plumb locale or currency formatting.

	// UTILS
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { formatCurrency } from '@/shared/utils/currency.js';

	let {
		value,
		currency
	}: {
		/** Amount in minor units, e.g. 7500 = EUR 75.00. */
		value: number;
		/** ISO 4217 code; falls back to the company currency when omitted. */
		currency?: string;
	} = $props();

	const label = $derived(formatCurrency(value, getLocale(), currency));
</script>

{label}
