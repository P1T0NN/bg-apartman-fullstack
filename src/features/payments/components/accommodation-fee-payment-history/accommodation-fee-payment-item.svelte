<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { getFeePaymentStatusLabel } from '@/features/payments/utils/getFeePaymentStatusLabel.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	let {
		payment
	}: {
		payment: FunctionReturnType<
			typeof api.tables.accommodationFeePayments.queries.fetchFeePayments.fetchFeePayments
		>['items'][number];
	} = $props();

	const amount = $derived(
		new Intl.NumberFormat(getLocale(), {
			style: 'currency',
			currency: payment.terms.currency
		}).format(payment.terms.amountMinor / 100)
	);

	const date = $derived(
		new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
			payment.createdAt
		)
	);
</script>

<div class="flex flex-wrap items-center justify-between gap-3 py-3">
	<div class="flex min-w-0 flex-col gap-1">
		<p class="font-medium">
			{amount}
		</p>

		<time
			class="text-sm text-muted-foreground"
			datetime={new Date(payment.createdAt).toISOString()}
		>
			{date}
		</time>

		{#if payment.refundedAmountMinor > 0}
			<p class="text-sm text-muted-foreground">
				{m['PaymentsFeature.FeePayments.refundAmount']({
					amount: new Intl.NumberFormat(getLocale(), {
						style: 'currency',
						currency: payment.terms.currency
					}).format(payment.refundedAmountMinor / 100)
				})}
			</p>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<Badge variant="outline">
			{getFeePaymentStatusLabel(payment)}
		</Badge>
	</div>
</div>
