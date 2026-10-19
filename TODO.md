# Payment implementation plan

Status: Checkout.com sandbox listing-fee checkout and payment verification are
deployed to development. Webhook registration and end-to-end sandbox testing
remain to be completed. Admin refund UI, guest payment collection and
host payout onboarding remain separate unfinished work. No live money is processed.

One-time listing fees use manual renewal, without subscriptions. Recommended
order: host listing fees, guest money flow, instant bookings, approval-based
bookings, then cash commission collection.

## Chunk 1: Choose and prepare a provider

- [ ] Select a provider that supports the required host countries and payout flow.
- [ ] Confirm account eligibility, currency support and settlement flow.
- [x] Preserve one-time listing periods, manual renewal and server-owned fee terms.
- [x] Keep shared payment fields and domain transitions provider-neutral.

## Chunk 2: Connect host listing-fee payments

- [x] Connect authenticated Checkout.com sandbox checkout and status refresh.
- [ ] Connect the admin recorded-payment refund operation.
- [x] Verify signatures and authoritative amount/currency/reference data.
- [x] Claim hosted-page creation once per attempt, use idempotent refunds and
      deduplicate events before reconciling authoritative provider state.
- [ ] Reconcile existing attempts before replacement and recover lost responses.
- [ ] Handle abandonment, late success, refunds and safe bounded retention.
- [ ] Preserve ownership, creation budgets, publication intent and paid-period rules.
- [x] Keep private history and owner-only payment confirmation queries.
- [x] Keep legacy payment/refund simulations disabled.
- [ ] Exercise checkout, fulfillment and refunds in the provider sandbox.

Shared records/transitions live in `src/convex/tables/accommodationFeePayments`.
Shared contracts/configuration live in `src/shared/features/payments`; payment UI
lives in `src/features/payments`. A browser return URL never proves payment.

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
- Keep external provider calls in the provider's Convex module once implemented;
  domain billing and booking transitions remain in their table features.
  Do not create unused wrappers or folders.
- Keep secrets and provider calls server-side. Derive identity and authoritative
  amounts on the server; browser success flags never prove payment.
- Extend existing helpers and UI instead of building a generic payment framework.
- For every code chunk, run focused money/security/lifecycle tests and
  `bunx --bun oxlint`; validate edited Svelte components and relevant type checks.
- Verify each payment flow end to end in the provider test environment before
  enabling that flow for real money.

References:
[existing accommodation billing design](docs/AccommodationBillingSystemDesign.md),
[loyalty decisions](docs/LoyaltySystem.md).
