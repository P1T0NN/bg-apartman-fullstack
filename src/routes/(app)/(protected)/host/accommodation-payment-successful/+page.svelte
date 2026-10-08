<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	// SVELTE IMPORTS
	import { onMount } from 'svelte';

	// LIBRARIES
	import { useAction, useQuery } from 'convex-svelte';
	import { m } from '@/lib/paraglide/messages.js';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import AccommodationPaymentResultHeader from '@/components/pages/(protected)/host/accommodation-payment-successful/accommodation-payment-result-header.svelte';
	import AccommodationPaymentResultLoading from '@/components/pages/(protected)/host/accommodation-payment-successful/loading/accommodation-payment-result-loading.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// CONSTANTS
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { getFeePaymentStatusLabel } from '@/features/payments/utils/getFeePaymentStatusLabel.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel.js';

	const paymentId = $derived(page.url.searchParams.get('fee_payment'));
	let checking = $state(false);
	let verificationFailed = $state(false);
	const confirmation = useQuery(
		api.tables.accommodationFeePayments.queries.fetchFeePaymentConfirmation
			.fetchFeePaymentConfirmation,
		// SAFETY: Convex validates the URL ID and verifies authenticated ownership.
		() => (paymentId ? { paymentId: paymentId as Id<'accommodationFeePayments'> } : 'skip')
	);
	const refresh = useAction(
		api.tables.accommodationFeePayments.actions.refreshFeePayment.refreshFeePayment
	);
	const payment = $derived(confirmation.data);
	const confirmed = $derived(Boolean(payment?.isCurrentPaidPeriod));
	const waiting = $derived(
		payment?.status === 'creating' ||
			payment?.status === 'pending' ||
			payment?.status === 'processing'
	);
	const unavailable = $derived(
		!paymentId || Boolean(confirmation.error) || (!confirmation.isLoading && !payment)
	);
	const title = $derived(
		confirmed
			? m['AccommodationPaymentResult.successTitle']()
			: waiting
				? m['AccommodationPaymentResult.pendingTitle']()
				: m['AccommodationPaymentResult.pageTitle']()
	);
	const description = $derived(
		confirmed
			? m['AccommodationPaymentResult.successDescription']()
			: waiting
				? m['AccommodationPaymentResult.pendingDescription']()
				: m['AccommodationPaymentResult.otherDescription']()
	);
	const amount = $derived(
		payment
			? new Intl.NumberFormat(getLocale(), {
					style: 'currency',
					currency: payment.terms.currency
				}).format(payment.terms.amountMinor / 100)
			: ''
	);

	function formatDate(timestamp: number) {
		return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'long', timeZone: 'UTC' }).format(
			timestamp
		);
	}

	async function verifyPaymentStatus() {
		if (!paymentId || checking) return;
		checking = true;
		verificationFailed = false;
		try {
			// SAFETY: the action validates the URL ID and checks authenticated ownership.
			await refresh({ paymentId: paymentId as Id<'accommodationFeePayments'> });
		} catch {
			verificationFailed = true;
		} finally {
			checking = false;
		}
	}

	onMount(() => {
		void verifyPaymentStatus();
	});
</script>

<SvelteHead title={m['AccommodationPaymentResult.pageTitle']()} noindex />

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
	<AccommodationPaymentResultHeader {title} {description} {confirmed} />
	{#if unavailable}
		<ErrorComponent message={m['AccommodationPaymentResult.unavailable']()} />
	{:else if confirmation.isLoading}
		<div role="status" aria-label={m['AccommodationPaymentResult.loading']()}>
			<AccommodationPaymentResultLoading />
		</div>
	{:else if payment}
		<section class="border-y py-6" aria-label={m['AccommodationPaymentResult.details']()}>
			<h2 class="mb-5 text-xl font-semibold">{payment.accommodationName}</h2>
			<dl class="grid gap-x-8 gap-y-6 sm:grid-cols-2">
				<div>
					<dt class="text-sm text-muted-foreground">{m['AccommodationPaymentResult.amount']()}</dt>
					<dd class="mt-1 text-lg font-semibold">{amount}</dd>
				</div>
				<div>
					<dt class="text-sm text-muted-foreground">{m['AccommodationPaymentResult.status']()}</dt>
					<dd class="mt-1 font-medium">{getFeePaymentStatusLabel(payment)}</dd>
				</div>
				{#if payment.paidAt}
					<div>
						<dt class="text-sm text-muted-foreground">
							{m['AccommodationPaymentResult.paidOn']()}
						</dt>
						<dd class="mt-1">
							<time datetime={new Date(payment.paidAt).toISOString()}>
								{formatDate(payment.paidAt)}
							</time>
						</dd>
					</div>
				{/if}
				{#if payment.billingPeriodEndsAt}
					<div>
						<dt class="text-sm text-muted-foreground">
							{m['AccommodationPaymentResult.paidThrough']()}
						</dt>
						<dd class="mt-1">
							<time datetime={new Date(payment.billingPeriodEndsAt).toISOString()}>
								{formatDate(payment.billingPeriodEndsAt)}
							</time>
						</dd>
					</div>
				{/if}
			</dl>
		</section>
		{#if confirmed}
			<p class="text-sm leading-relaxed text-muted-foreground">
				{m['AccommodationPaymentResult.manualRenewal']()}
			</p>
		{/if}
		{#if verificationFailed && !confirmed}
			<p role="alert" class="text-sm text-destructive">
				{m['AccommodationPaymentResult.verificationFailed']()}
			</p>
		{/if}
	{/if}
	<div class="flex flex-wrap gap-3">
		<Button href={PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS} size="lg">
			{m['AccommodationPaymentResult.accommodations']()}
			<span class="icon-[lucide--arrow-right]" aria-hidden="true"></span>
		</Button>
		{#if payment && !confirmed}
			<Button variant="outline" size="lg" disabled={checking} onclick={() => void verifyPaymentStatus()}>
				{m['AccommodationPaymentResult.refresh']()}
			</Button>
		{/if}
	</div>
</div>
