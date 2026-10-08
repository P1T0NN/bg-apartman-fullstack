# Accommodation billing

Host listing fees are separate from guest payment methods (`supportedPaymentMethods`)
and guest booking payments. Creation requires an explicit plan choice in Pricing.

## Stored fields

| Field           | Purpose                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `billingPlanId` | Selected billing plan, `flat_fee`, `booking_fee`, or admin-granted `free`. This is not a Stripe Price ID. |
| `billingTerms`  | Server-owned snapshot of the accepted offer, discriminated by `model`.                                    |
| `billingStatus` | Platform eligibility: `pending_payment` or `active`. This is not a Stripe subscription or payment status. |
| `status`        | Host publication choice: `published`, `unpublished`, or `deleted`.                                        |

Flat-fee terms contain `model: 'flat_fee'`, `amountMinor: 30000`, `currency: 'EUR'`
and `intervalMonths: 3`. Booking-fee terms contain `model: 'booking_fee'` and
`commissionBps` (100 basis points = 1%). The standard booking commission is
1000 basis points (10%). Rates are required numbers; zero is an explicit admin
waiver. Previously unconfigured listings were initialized to 10%, while existing
admin rates were preserved. Collection remains deferred.

The catalog lives in `src/shared/features/accommodations/config.ts`; plan validation
lives in `schemas/accommodationSchemas.ts`. The client
submits only `billingPlanId`; creation resolves and snapshots terms server-side.
Ordinary listing edits cannot change the plan, terms, or billing status. Changing configuration affects new listings; existing listings keep their accepted terms.

## Current behavior

- Flat fee: creation stores `billingStatus: 'pending_payment'` and
  `status: 'published'`. The owner sees Awaiting payment and Pay to activate.
  Pay redirects to Stripe-hosted one-time Checkout using the stored fee terms.
- Booking fee: creation stores `billingStatus: 'active'` and `status: 'published'`.
  No upfront payment is required and no booking commission is collected yet.
- The publish toggle changes the host's choice even while payment is due. Public
  search, map, detail, favorites and new bookings require published status and
  active billing. Flat fees also require a non-null, future paid-period deadline.
- The owner list includes billing fields. Guest list/detail responses omit them.
- Settings contains Accommodation fees with a live owner-only billing query and
  a dedicated plan-change mutation. Switching to unpaid flat fees hides the
  listing; switching back restores the host's publish/pause choice. Paid periods
  reject switching until their deadline. See
  [AccommodationFeeStrategySystemDesign.md](./AccommodationFeeStrategySystemDesign.md).
- `status` is the host's publication choice and billing never overwrites it.
  `billingPeriodEndsAt` is required but nullable until payment grants a period.
  `migrateAccommodationPublicationStatus` restored the previous host choice and
  removed the redundant legacy field across all 101 development accommodations.
  Verified payment grants the stored interval in UTC
  calendar months (clamped at month end) and schedules expiry.
- `billingPlanId`, `billingTerms` and `billingStatus` are required on every listing.
  New seed rows use `booking_fee`, its catalog terms and `active` billing.
  `commissionBps` is required and numeric; the standard rate is 1000 basis points.

## Backfill existing seeded listings

`migrations/backfillAccommodationBilling` assigns missing billing fields to
`booking_fee` with catalog terms and `active` billing. It preserves published,
paused and deleted visibility, existing billing choices and timestamps. Partial
billing data rejects the batch rather than overwriting an existing choice.
It also converts prior plan identifiers to `flat_fee` or `booking_fee` using the
saved terms, without replacing those terms. The migration is bounded and safe to rerun.

For a deployment with missing fields, deploy the migration with the three billing
fields temporarily optional in the accommodation schema and the owner summary's
`billingStatus` return validator. During this transition, use `v.optional(v.string())`
for `billingPlanId` so the migration can rename prior identifiers. Run:

```powershell
bunx convex run migrations/migrations:run "{fn:'migrations/backfillAccommodationBilling:backfillAccommodationBilling',batchSize:50,reset:true}"
```

Wait for the migration to finish, then deploy the required validators. The source
contains the final required schema; do not deploy it over unbackfilled rows.
The development backfill completed on 2026-10-07 across all 101 accommodations.
The required schema was deployed after completion.

## One-time Stripe listing-fee checkout (chunk 2)

The approved integration buys one stored listing-fee period through hosted
Checkout with `mode: 'payment'`. Renewal requires another explicit payment after
expiry. There are no subscriptions or automatic renewals. Guest booking payment
methods and the accommodation booking page are unchanged.

`AccommodationFlatFeePaymentButton` calls the authenticated
`accommodationFeePayments/actions/createFeeCheckout` action. The server verifies
ownership, listing state and accepted flat-fee terms. It freezes amount, EUR
currency and interval in a payment attempt; the browser supplies only the listing
ID. Checkout uses inline `price_data` so admin fee overrides are honored without
maintaining a separate Stripe Price catalog. Zero/free access uses the existing
admin grant flow; a payable EUR amount must meet Stripe's minimum of 50 cents.

An indexed latest-attempt lookup and atomic mutation reuse creating, pending or
processing attempts. Stripe creation and refund calls use stable idempotency keys.
Checkout expires after an hour; unattached attempts with less than 30 minutes
remaining are replaced to satisfy Stripe's creation deadline. A scheduled action
reconciles or expires abandoned sessions. Paid asynchronous sessions stay
processing until payment succeeds or fails; returning from Checkout is optional.

An attached session is reconciled before its expired/invalidated local attempt can
be replaced. If Stripe reports payment success or ongoing processing, checkout
does not create another payable session. Verification errors also block a
replacement. Open sessions are expired through Stripe before replacement. Stripe
idempotency keys and atomic attempt allocation protect concurrent requests.

`STRIPE_CONFIG` limits checkout requests to 5/minute/account. Only new attempts
consume the creation budget: 10/day/account. Reusing an attempt does not consume
another creation token. Limits use the existing rate-limiter component and are
scoped to the authenticated account, so exhausting one account's budget does not
block other accounts. There are no shared global checkout limits.

Indexed maintenance runs every 15 minutes in bounded batches. It retries failed
reconciliation and pending refund work, including recovering sessions whose Stripe
creation response was lost. Confirmed closed, unpaid attempts are removed after
7 days; paid, refunded, processing and unresolved records are retained. Event
deduplication receipts expire after 30 days; durable payment states still prevent
replayed events from extending access. A provider history search is bounded to
three pages; incomplete searches retain the receipt and retry rather than assuming
no payment exists. Stripe keeps its own expired session/payment history.

Existing attempts are enrolled through the bounded, repeatable migration
`migrations/backfillFeePaymentMaintenance:backfillFeePaymentMaintenance`.

### Payment records, verification and activation

`src/convex/tables/accommodationFeePayments` owns payment attempts, frozen terms,
owner/listing linkage, provider references, payment/refund status and the granted
period. `stripeWebhookEvents` stores processed event IDs. Indexed lookups use
listing, Checkout Session and PaymentIntent IDs; histories are paginated. No
payment arrays or Stripe fields are added to accommodations.

`src/convex/http.ts` exposes `POST /stripe-webhook`. The Node handler verifies the
raw-body signature and test/live mode, retrieves current provider objects, and
checks the session reference, total, currency and payment mode against the frozen
receipt. SDK calls live under `src/convex/stripe`; Zod boundary schemas live in
`src/shared/features/stripe/schemas/stripeSchemas.ts` and shared provider types in
`src/shared/features/stripe/types/stripeTypes.ts`.
Provider or persistence failures return HTTP 500 for Stripe retries; invalid
signatures return 400. Unsupported and connected-account events are ignored.

One internal mutation deduplicates events and grants entitlement only for verified
paid sessions. It preserves publication intent, including a deliberate host pause.
The period starts at server fulfillment time and uses UTC calendar months with
month-end clamping. An active future period cannot be bought again or extended by
a duplicate event. Existing scheduled expiry and public deadline checks remove
eligibility after expiry without relying on scheduler timing.

Plan changes, admin overrides, free grants and deletion invalidate the current
payment attempt. A late payment for deleted/changed listings or a superseded
attempt is refunded instead of activating access. Retries of the same webhook
continue an unfinished automatic refund using the same idempotency key. Already
refunded payments cannot be reactivated by older Checkout events. Existing
bookings and commission snapshots are preserved.

### Owner status and admin refunds

Host settings show paginated payment history with amount, payment date, period,
status and refunded amount. History rows display live status without a manual
refresh button. Returning from Checkout requests a server-verified refresh;
URL flags never establish payment. Cancellation leaves the listing unpaid and
allows reuse of the pending Checkout Session.

Successful Checkout returns to `/host/accommodation-payment-successful?fee_payment=<id>`.
The page refreshes provider state and subscribes to the owner-only
`fetchFeePaymentConfirmation` query. It shows the accommodation, fee, status,
payment date and paid-through date, with a My accommodations CTA. Success requires
the receipt's paid period to still be applied; pending, failed, refunded,
unavailable and verification-error states never imply activation. Renewal remains
manual. Already-created Stripe sessions retain their original return URLs.

The existing admin refund dialog targets the latest recorded payment and freezes
the reviewed payment ID and remaining amount. The server independently checks
admin identity and the refundable balance. A pending or failed refund cannot
revoke access; a verified full refund revokes only its own still-current paid
period. Partial external refunds remain visible without ending the period. Admin
grants and later paid periods cannot be revoked by refunds of older receipts.
Failed/canceled refunds can be retried with a new recorded attempt.

`ACCOMMODATION_PAYMENT_SIMULATION = false` disables the legacy
`payFlatFeeAccommodation` and `refundFlatFeeForAccommodation` entry points.
The host and admin UI call the real payment actions.

### Development setup and verification

Chunk 1 code setup is complete, and the owner has handled Stripe account setup.
`getStripe` resolves deployment secrets lazily; the internal read-only
`verifyStripeTestSetup` checks test-mode account/balance readiness without
exposing bank/contact data. On 2026-10-08 the development account reported ES/EUR,
enabled test charges/payouts and `livemode: false`.

Chunk 2 registered an enabled **test-mode** webhook at
`https://grateful-otter-919.eu-west-1.convex.site/stripe-webhook` and securely saved
its signing secret in development Convex. It listens for Checkout completion,
asynchronous success/failure, session expiry, refund creation/update/failure and
charge refunds. No live account configuration was changed.

`verifyStripeWebhookSetup` is a read-only endpoint configuration check;
`configureStripeTestWebhook` is an internal test-only provisioning action that
returns a newly generated signing secret to the deployment operator. Neither is
public. Do not log or commit signing secrets. Runtime secrets belong in Convex:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and the server-owned
`PUBLIC_ORIGIN` (hosted Checkout needs no browser publishable key).

Automated tests cover SDK Checkout/refund calls, real SDK webhook signatures,
ownership, amount/reference tampering, event replay, stale attempts/overrides,
publication preservation, delayed payments, refunds and calendar-month expiry.
A hosted Checkout test-card payment/refund has **not** yet been completed; this
remains a release check before collecting real money. Production needs its own
matching webhook signing secret and endpoint; development configuration is not a
production deployment.

References: [Checkout creation and expiry](https://docs.stripe.com/api/checkout/sessions/create),
[verified fulfillment](https://docs.stripe.com/checkout/fulfillment),
[refund lifecycle](https://docs.stripe.com/refunds).

## Admin fee overrides and free access

`/admin/accommodations` provides a paginated management table with name search
and publication, fee-plan and billing-status filters. Admin-only mutations use
the existing `adminMutation` builder and server-side validation.

`updateAccommodationFeeForAdmin` replaces flat-fee or booking-fee terms and
billing state without the host switching lock. It can revoke free access,
change commission, reset payment requirements, or replace an active paid
period. Active flat fees require a future deadline; booking fees are active
without a deadline. Deleted listings cannot be edited through fee mutations.

`grantFreeAccommodationFeeForAdmin` assigns `billingPlanId: 'free'`,
`billingTerms: { model: 'free' }` and active billing. There is no flat fee or
booking commission. The existing required `billingPeriodEndsAt` is a UTC
deadline for temporary access, or null for permanent access. Host forms cannot
select free access or override an active grant. No schema backfill is needed.

Temporary access schedules `expireFreeAccommodationFee`, which restores the
current catalog booking-fee terms when the matching deadline expires. It ignores
early jobs, deleted listings, replaced plans and superseded deadlines. Permanent
grants schedule no expiry. All admin fee mutations preserve host publication
status. Booking fee snapshotting evaluates the free-period deadline directly
rather than relying on scheduler timing alone.

## Booking commission snapshots

The standard fee is 10% of the final discounted accommodation stay total,
including the actual weekend rates. It is a host commission deducted from the
booking proceeds, not an additional guest surcharge. There are currently no
separate taxes or extras in this base. Adding them requires an explicit policy.

Every new booking stores required `platformFeeTerms` with `model`,
`commissionBps`, `baseAmountMinor`, `amountMinor`, and `currency`. The server
calculates this snapshot at booking creation using `calculateBookingPlatformFee`.
Commission rounds half up to the nearest minor currency unit once per booking;
integer arithmetic avoids floating-point multiplication errors. For example,
EUR 240.75 at 10% produces EUR 24.08 commission.

An active, unexpired paid flat-fee period or valid free grant has zero commission
for that booking. Temporary free grants resolve against server time even when
expiry processing is delayed; after expiry the catalog booking rate applies.
Explicit admin rate overrides remain supported. Listing changes, host acceptance,
cancellation and later plan switches never rewrite existing fee snapshots.
Both cash and online bookings capture identical fee terms.

A snapshot records the original calculated fee, not a collected payment or an
amount currently owed. Pending requests do not create a charge. Declined,
expired or cancelled bookings retain their historical snapshot. Before collection
ships, decide when fees become payable, cancellation/refund adjustments, and how
cash commission is invoiced or reconciled. Keep future payment/refund records
separate and link them to booking IDs; verified, idempotent provider events will
record actual collection. No Stripe calls or collection status are simulated here.

Historical bookings store `platformFeeTerms: null`, meaning unknown historical
terms, never zero commission. Do not reconstruct fees from today's listing plan
or charge those records automatically. New seeded bookings include calculated
terms; existing seeded history remains unknown because its original plan was not
recorded.

### Migration sequence

1. Deploy the new writer with a temporary optional snapshot validator and the
   existing nullable accommodation commission validator.
2. Run `migrations/backfillBookingPlatformFees:configureBookingFeeCommission`
   through `migrations/migrations:run`. It replaces only null listing commission
   rates with the configured 10% default and preserves explicit admin rates.
3. Run `migrations/backfillBookingPlatformFees:backfillBookingPlatformFeeTerms`
   through the same runner. It sets missing historical snapshots to null and
   preserves existing snapshots. Both migrations are bounded and repeatable.
4. Confirm completion, require `platformFeeTerms` (object or historical null),
   and require numeric accommodation commission rates.

Development migration on 2026-10-07 processed 101 accommodations and 394 bookings,
then deployed the required validators. No temporary optional billing fields remain.
