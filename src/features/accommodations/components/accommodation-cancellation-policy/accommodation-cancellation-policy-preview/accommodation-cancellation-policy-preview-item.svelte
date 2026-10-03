<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type {
		CancellationPolicyRange,
		CancellationRefundPercentage
	} from '@/shared/features/accommodations/types/cancellationPolicyTypes.js';

	let {
		range,
		percentage
	}: {
		range: CancellationPolicyRange;
		percentage: CancellationRefundPercentage;
	} = $props();
</script>

<div class="grid gap-1 sm:grid-cols-2">
	<dt>{m[`AccommodationsFeature.AccommodationCancellationPolicyItem.${range}`]()}</dt>
	<dd>{m[`AccommodationsFeature.AccommodationCancellationPolicyItem.refund${percentage}`]()}</dd>
</div>
