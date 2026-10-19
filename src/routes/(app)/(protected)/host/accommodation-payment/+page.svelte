<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '@convex/_generated/api.js';
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';
	import { Button } from '@/components/ui/button/index.js';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import AccommodationPaymentHeader from '@/components/pages/(protected)/host/accommodation-payment/accommodation-payment-header.svelte';
	import AccommodationPaymentLoading from '@/components/pages/(protected)/host/accommodation-payment/loading/accommodation-payment-loading.svelte';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import type { Id } from '@convex/_generated/dataModel.js';

	const paymentId = $derived(page.url.searchParams.get('fee_payment'));
	const checkout = useQuery(
		api.tables.accommodationFeePayments.queries.fetchFeePaymentConfirmation
			.fetchFeePaymentConfirmation,
		// SAFETY: Convex validates the URL ID and checks authenticated ownership.
		() => (paymentId ? { paymentId: paymentId as Id<'accommodationFeePayments'> } : 'skip')
	);
	const payment = $derived(checkout.data);
	const amount = $derived(
		payment
			? new Intl.NumberFormat(getLocale(), {
					style: 'currency',
					currency: payment.terms.currency
				}).format(payment.terms.amountMinor / 100)
			: ''
	);
	const unavailable = $derived(
		!paymentId || Boolean(checkout.error) || (!checkout.isLoading && !payment)
	);
</script>

<SvelteHead title={m['AccommodationPaymentCheckout.pageTitle']()} noindex />
<div class="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
	<AccommodationPaymentHeader />
	{#if unavailable}
		<ErrorComponent message={m['AccommodationPaymentResult.unavailable']()} />
	{:else if checkout.isLoading}
		<div role="status" aria-label={m['AccommodationPaymentCheckout.loading']()}>
			<AccommodationPaymentLoading />
		</div>
	{:else if payment}
		<section
			class="flex flex-col gap-2 border-y py-6"
			aria-label={m['AccommodationPaymentResult.details']()}
		>
			<h2 class="text-xl font-semibold">{payment.accommodationName}</h2>
			<p class="text-3xl font-semibold tabular-nums">{amount}</p>
			<p class="text-sm text-muted-foreground">
				{m['AccommodationPaymentCheckout.period']({ months: payment.terms.intervalMonths })}
			</p>
		</section>
		<p role="status">{m['AccommodationPaymentCheckout.checkoutUnavailable']()}</p>
		<Button href={PROTECTED_PAGE_ENDPOINTS.ACCOMMODATION_PAYMENT_RESULT(payment._id)}>
			{m['AccommodationPaymentCheckout.result']()}
		</Button>
	{/if}
	<Button variant="ghost" href={PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS}>
		{m['AccommodationPaymentResult.accommodations']()}
	</Button>
</div>
