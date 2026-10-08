# Payment implementation plan

Status: proposed chunks only. Implementation starts after the user gives the
instruction to start. Recommendations below are not approved business policies.

Recommended order: host listing fees, guest money flow, instant bookings,
approval-based bookings, then cash commission collection. Loyalty activation can
proceed separately once its policies are agreed.

## Chunk 1: Confirm provider and listing-fee billing model

Start here, before provider-specific implementation.

- [ ] Verify provider availability for the business country and account.
- [ ] Confirm supported settlement currency and configure a test environment.
- [ ] Decide whether the existing three-month listing fee buys a fixed period or
      renews automatically. Recommendation: one-time payment with manual renewal
      initially; add subscriptions only if automatic renewal is wanted.
- [ ] Confirm listing-fee refund and paid-period rules before collecting money.

Done when: the provider and first billing model are agreed and test access works.
Guest payout and loyalty decisions do not block this chunk.

## Chunk 2: Implement real host listing-fee payments

Build the payment foundation inside this first complete flow, extending the
existing accommodation billing behavior.

- [ ] Store payment attempts, frozen amounts/currency, payer and accommodation
      linkage, provider references, payment status and processed webhook events.
- [ ] Create checkout server-side using stored accommodation billing terms and
      authenticated ownership. Recommendation: hosted checkout initially.
- [ ] Verify webhook signatures and payment amounts/currency; process each payment
      once, including duplicate or out-of-order notifications.
- [ ] Activate the paid period only after verified payment success. Preserve host
      publication intent, deletion and later changes to billing terms.
- [ ] Handle failed/abandoned checkout, safe retries, renewal after expiry and
      late payment notifications.
- [ ] Show payment status/history in the existing host fee surfaces.
- [ ] Replace simulated refunds with refunds against recorded payments; record
      provider results and update entitlement only after successful refund.
- [ ] Disable the development payment/refund simulation entry points before
      enabling real payments.
- [ ] Test ownership, amount tampering, duplicate checkout/payment events, failed
      payments, refunds and paid-period expiry.

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
