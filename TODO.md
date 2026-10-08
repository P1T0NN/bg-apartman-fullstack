# Payment implementation plan

Status: chunk 1 code setup complete; the owner confirmed Stripe account setup is
handled. Chunk 2 listing-fee checkout is implemented and deployed to development
test mode. A hosted Checkout test-card payment/refund remains a release check.
Chunks 3-6 have not started. The accommodation booking page is intentionally
untouched. One-time listing fees use manual renewal, without subscriptions.

Recommended order: host listing fees, guest money flow, instant bookings,
approval-based bookings, then cash commission collection. Loyalty activation can
proceed separately once its policies are agreed.

## Chunk 1: Confirm provider and listing-fee billing model

Start here, before provider-specific implementation.

- [x] Confirm Stripe as the selected provider for this setup work.
- [x] Verify development test access with the existing Convex Stripe credentials.
      Read-only verification returned `livemode: false`, account country `ES`,
      default currency `eur`, and enabled test charges/payouts on 2026-10-08.
- [x] Check provider availability for the reported test-account country: Spain is
      listed in [Stripe's supported countries](https://stripe.com/global).
- [x] Account/business setup is handled by the owner. Code verification uses test
      mode; test flags are not live approval.
- [x] Confirm EUR is supported as a charge currency. Existing catalog terms are
      EUR 300 for three calendar months; existing accommodation snapshots remain
      authoritative, including admin overrides.
- [x] Account/bank configuration is handled by the owner.
- [x] Use one-time payment for a fixed period with manual renewal. No subscription
      or automatic renewal will be added.
- [x] Preserve existing UTC calendar-month clamping, disallow early renewal, and
      start the paid period on verified fulfillment. Admins can refund a recorded
      payment; guest cancellation/refund policies remain separate.

Chunk 1 code setup is complete. Chunk 2 adds Checkout and verified fulfillment.
No subscriptions, automatic renewal or guest booking checkout are included.

The internal read-only check can be rerun with:

```powershell
bunx convex run stripe/actions/verifyStripeTestSetup:verifyStripeTestSetup '{}'
```

Provider initialization lives in `src/convex/stripe/helpers/getStripe.ts`; the
check lives in `src/convex/stripe/actions/verifyStripeTestSetup.ts`. Missing secrets
fail when the helper is used, rather than breaking unrelated functions on import.

Done when: the provider and first billing model are agreed and test access works.
Guest payout and loyalty decisions do not block this chunk.

## Chunk 2: Implement real host listing-fee payments

Build the payment foundation inside this first complete flow, extending the
existing accommodation billing behavior.

- [x] Store payment attempts, frozen amounts/currency, payer and accommodation
      linkage, provider references, payment status and processed webhook events.
- [x] Create checkout server-side using stored accommodation billing terms and
      authenticated ownership. Recommendation: hosted checkout initially.
- [x] Verify webhook signatures and payment amounts/currency; process each payment
      once, including duplicate or out-of-order notifications.
- [x] Activate the paid period only after verified payment success. Preserve host
      publication intent, deletion and later changes to billing terms.
- [x] Handle failed/abandoned checkout, safe retries, renewal after expiry and
      late payment notifications.
- [x] Limit checkout requests and new attempts per account. Reconcile
      an existing provider session before allowing its replacement; block a new
      session if payment succeeded, is processing, or cannot be verified.
- [x] Retry due payment reconciliation in bounded periodic jobs. Clean up only
      verified closed unpaid attempts after 7 days and event receipts after
      30 days; retain actual payments/refunds and unresolved processing records.
- [x] Show payment status/history in the existing host fee surfaces.
- [x] Replace simulated refunds with refunds against recorded payments; record
      provider results and update entitlement only after successful refund.
- [x] Disable the development payment/refund simulation entry points before
      enabling real payments.
- [x] Test ownership, amount tampering, duplicate checkout/payment events, failed
      payments, refunds and paid-period expiry.
- [x] Register the development test-mode `/stripe-webhook` endpoint for Checkout,
      asynchronous payment, expiry and refund events; save its signing secret in
      Convex. Read-only verification confirms it is enabled for all eight events.
- [ ] Complete a hosted Checkout test-card payment and refund end to end before
      enabling real money. Automated SDK-boundary tests cover signed webhooks,
      fulfillment and refunds; a browser payment has not been performed.

Payment records/functions live in `src/convex/tables/accommodationFeePayments`;
event deduplication uses `stripeWebhookEvents`. Reusable Stripe calls stay in
`src/convex/stripe`. Owner fee history lives in `src/features/payments`; the
existing admin refund dialog targets a recorded payment and reviewed amount.
Checkout uses inline server-owned prices to preserve accommodation fee overrides.

Done when: a host can pay for a listing period, see the result and history, and
receive a supported refund. Returning to the success page is not required for
activation. This is the first independently usable payment release.

## Chunk 3: Agree guest money flow and prepare host payments

Complete this before implementing guest checkout.

- [ ] Decide who receives guest payments and how the host receives their share.
- [ ] Agree payout timing and who bears processing fees, refunds and disputes.
- [ ] Define when the frozen platform commission becomes payable and how
      cancellations adjust it.
- [ ] Decide how commission is collected for cash bookings; implementation can
      follow in chunk 6.
- [ ] Verify provider support for the required host countries and implement the
      necessary host onboarding and payment eligibility checks.

Done when: collection, host settlement and commission responsibilities are clear,
and eligible hosts can receive online booking payments. Host listing fees remain
separate from guest accommodation payments.

## Chunk 4: Implement paid instant bookings

Proposed flow: temporarily reserve dates -> guest pays -> verify payment ->
confirm booking.

- [ ] Create an expiring availability hold and a payment attempt using the frozen
      booking total/currency and platform commission snapshot.
- [ ] Keep booking lifecycle and payment status separate. Confirm and send the
      correct notices after authoritative payment verification.
- [ ] Release unpaid holds at the deadline and support safe payment retries.
- [ ] Handle payment success after expiry/cancellation without confirming an
      unavailable stay; reconcile or refund the payment.
- [ ] Implement cancellation refunds against actual collected amounts and the
      frozen cancellation policy, including applicable host/platform adjustments.
- [ ] Display accurate unpaid, processing, paid and refunded states in checkout,
      confirmation, guest/host booking details, recovery views and emails.
- [ ] Test concurrent bookings, failed/abandoned checkout, duplicate events,
      delayed success, cancellation races and refunds before release.

Done when: instant bookings have a complete payment, availability and refund
lifecycle. Use recorded booking prices rather than current property prices.

## Chunk 5: Add payments after host approval

Recommended flow, subject to agreement: guest requests -> host accepts ->
awaiting payment -> guest pays -> booking confirmed.

- [ ] Agree the payment deadline and cap it against the scheduled check-in time.
- [ ] Adapt host acceptance to reserve dates and request payment without claiming
      the online booking is already paid/confirmed.
- [ ] Reuse chunk 4 checkout, payment records, verification and refund handling.
- [ ] Expire unpaid accepted requests and release dates; keep this deadline
      distinct from the existing host-response deadline.
- [ ] Update guest/host actions, booking statuses and notifications for awaiting
      payment, payment completion and expiry.
- [ ] Test acceptance/payment/expiry races, declined requests and cancellation
      while awaiting payment. Declined requests collect no money.

Done when: approved online requests become confirmed only after successful payment,
and unpaid accepted requests cannot reserve dates indefinitely. Preserve the
separate cash booking behavior.

## Chunk 6: Collect cash commissions and activate loyalty separately

- [ ] Implement the cash commission invoicing/reconciliation policy agreed in
      chunk 3, including verified collection and cancellation adjustments.
- [ ] Distinguish calculated commission from amounts actually due or collected.
- [ ] Preserve historical bookings with unknown fee terms; do not automatically
      charge them using today's accommodation terms.
- [ ] Resolve the loyalty questions in `docs/LoyaltySystem.md` before activation.
- [ ] Explicitly decide whether online bookings receive loyalty benefits; current
      booking benefits are disabled globally and limited to cash when enabled.
- [ ] Activate agreed earning/eligibility rules using verified stay/payment facts
      without rewriting benefits frozen on existing bookings.

Done when: cash commission records reflect actual obligations/collection. Loyalty
can ship independently when its policies are agreed; it does not block ordinary
payments.

## Project ownership and release checks

- Reuse `src/features/payments` for payment UI/hooks and
  `src/shared/features/payments` for shared contracts, validation and pure logic.
- Keep payment records and their operations in the owning Convex table feature
  under `src/convex/tables`; accommodation and booking features own their domain
  transitions. Follow `docs/CodingRules.md`, `docs/ProjectCodingRules.md` and the
  generated Convex guidelines before implementation.
- Keep reusable Stripe SDK operations in `src/convex/stripe/helpers` and pure
  provider utilities in `src/convex/stripe/utils` when needed. Registered actions
  belong in `src/convex/stripe/actions`; domain billing and booking transitions
  remain in their table features. Do not create unused wrappers or folders.
- Keep secrets and provider calls server-side. Derive identity and authoritative
  amounts on the server; browser success flags never prove payment.
- Extend existing helpers and UI instead of building a generic payment framework.
- For every code chunk, run focused money/security/lifecycle tests and
  `bunx --bun oxlint`; validate edited Svelte components and relevant type checks.
- Verify each payment flow end to end in the provider test environment before
  enabling that flow for real money.

References:
[existing accommodation billing design](docs/AccommodationBillingSystemDesign.md),
[loyalty decisions](docs/LoyaltySystem.md),
[Stripe Checkout](https://docs.stripe.com/payments/checkout),
[verified payment fulfillment](https://docs.stripe.com/checkout/fulfillment).
