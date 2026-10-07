<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// TYPES
	import type { Doc } from '@convex/_generated/dataModel.js';

	let { status }: { status: Doc<'accommodations'>['billingStatus'] | 'expired' } = $props();

	const STATUS_LABELS = {
		active: () => m['AccommodationsFeature.AccommodationBillingStatusBadge.active'](),
		pending_payment: () =>
			m['AccommodationsFeature.AccommodationBillingStatusBadge.awaitingPayment'](),
		expired: () => m['AccommodationsFeature.AccommodationBillingStatusBadge.expired']()
	};
</script>

<Badge variant="secondary">{STATUS_LABELS[status]()}</Badge>
