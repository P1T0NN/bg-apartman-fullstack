# Accommodation billing

Host listing fees are separate from guest payment methods (`supportedPaymentMethods`)
and guest booking payments. Creation requires an explicit plan choice in Pricing.

## Stored fields

| Field           | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `billingPlanId` | Selected billing plan, `flat_fee`, `booking_fee`, or admin-granted `free`. |
| `billingTerms`  | Server-owned snapshot of the accepted offer, discriminated by `model`.     |
| `billingStatus` | Platform eligibility: `pending_payment` or `active`.                       |
| `status`        | Host publication choice: `published`, `unpublished`, or `deleted`.         |

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
  Pay creates a Checkout.com sandbox Hosted Payments Page and redirects the owner.
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

## Provider-neutral listing-fee payments

`src/convex/tables/accommodationFeePayments` retains frozen amount/currency/interval,
owner/listing linkage, provider name, `providerCheckoutId`, `providerPaymentId`,
payment/refund status and paid-period timestamps. Optional provider-neutral
`providerEnvironment` and `providerAccountId` freeze the receiving account.
Provider references are scoped
by provider in their indexes. Shared `PAYMENTS_CONFIG` owns attempt duration and
owner creation budgets.

Internal mutations preserve ownership checks, frozen-price verification, attempt
reuse, activation and refund recording. `src/convex/checkout` integrates Checkout.com
sandbox Hosted Payments Pages; live keys and live API/redirect URLs are rejected.
Authenticated `createFeeCheckout` and `refreshFeePayment` actions use the existing
fee records. The selected sandbox processing channel is frozen as `providerAccountId`.
Only a matching server-retrieved payment with the full captured balance activates
the paid period. Browser redirects and authorization alone never grant access.

Provider response and webhook schemas live in
`src/shared/features/checkout/schemas/checkoutSchemas.ts`, with non-secret settings
in the feature's `config.ts` and redirect validation under `utils`. Secret environment
reads and authenticated requests stay in separate Convex `getCheckoutConfig` and
`checkoutRequest` helpers. The HTTP handler is `checkout/checkoutWebhook.ts`, with
signature verification under its `utils`; payment and refund reconciliation have
separate helpers. Shared `PAYMENTS_CONFIG.reconcileIntervalMs` owns retry timing.

Hosted-page creation is claimed transactionally because its API has no documented
idempotency support. Explicit rejected requests allow a fresh attempt; ambiguous
network failures remain blocked until the one-hour unattached-attempt expiry.
Sandbox card checkout enables 3DS, requests automatic capture and defaults the billing
country to RS; collect the host's actual billing country before supporting live payments.

`POST /checkout-webhook` verifies HMAC-SHA256 against the raw body and the separate
`CHECKOUT_WEBHOOK_SECRET`. Event IDs are deduplicated for seven days. The event queues
server-side reconciliation rather than applying its payload as payment truth. A
bounded minute cron retries outstanding checkout/refund verification and removes
expired event IDs. Late invalidated payments request refunds with stable provider
idempotency keys. The admin Refund fee button now completes refunds for
development-simulation receipts through the shared request/application mutations
in one transaction. Fully refunding the current paid period clears its deadline
and requires payment again, hiding the listing while preserving its publication
choice and existing bookings. Later paid periods are preserved. Other providers
remain unavailable from this button until real refund submission is connected.

Configure `CHECKOUT_API_SECRET`, `CHECKOUT_API_BASE_URL`,
`CHECKOUT_PROCESSING_CHANNEL_ID` and `CHECKOUT_WEBHOOK_SECRET` on the Convex development
deployment; `PUBLIC_ORIGIN` supplies return URLs. In Checkout.com's sandbox dashboard,
register `https://<development-deployment>.convex.site/checkout-webhook` for payment
events with the same signature key and the chosen processing channel. Run a test card
through Pay now and verify both the sandbox payment and the application's paid period.
Payout onboarding and public listing visibility are separate requirements.

Paid-period activation preserves publication intent, uses UTC calendar-month
clamping and cannot extend access on replay. Late payments for superseded attempts,
changed terms or deleted listings are marked for refund. Full refunds revoke only
their own still-current period; newer periods and admin grants remain intact.

Host history remains paginated and owner/admin scoped. The confirmation route
`/host/accommodation-payment-successful?fee_payment=<id>` uses the owner-only
`fetchFeePaymentConfirmation` query. URL parameters never prove payment, and only
a currently applied paid period produces its success state. Manual renewal and
checkout-cancellation display remain in place. Existing payment records and their
provider-neutral terms are retained when an integration is removed.

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

A snapshot records the original calculated fee. Online booking payments split
that frozen commission to the platform and the remainder to the host automatically
(10% / 90% at the standard rate). Hosts are not invoiced later for this allocation.
Payment capture and allocation must be verified; stay completion is independent.

`syncBookingFeePayment` maintains expected allocations for confirmed/completed
online bookings. Cash, exemptions and unknown terms create none. Unverified
allocations stop contributing to pending totals on cancellation; verified receipts remain for refunds.
Internal `applyBookingFeePayment` verifies the full captured amount and both
shares against frozen booking terms, currency and provider identity. Capture can
be recorded before completion, even without a preceding expected-allocation row.
Idempotent writes and cumulative commission refunds prevent duplicate earnings.
Original host shares are allocation facts, not proof of bank settlement.

`grossAmountMinor`, `hostAmountMinor` and `pendingOnlineSplit` are required on all
fee records. Development migration on 2026-10-19 backfilled 391 legacy records
from their frozen booking terms before enforcing these validators. Legacy cash
rows retain `pendingOnlineSplit: false`; no payment status or earnings changed.
The temporary backfill was removed after completion and verification.

The host dashboard shows Booked value and Bookings cards and the gross booked-value
chart. Pending and deducted platform fees remain backend bookkeeping without host
dashboard cards or explanatory fee copy. Admin Revenue and the
daily chart sum net flat-fee and booking-fee receipts. No actual collection, bank
payout or guest-payment refund submission is implemented by these records.

Paid flat-fee hosts remain locked until their stored three-calendar-month deadline.
They can switch exactly at expiry without waiting for a cron. Explicit admin
billing overrides are separate and never imply an automatic refund.

The development fixture split on 2026-10-19 retains 50 booking-fee and 51 flat-fee
listings (Test 1 remains flat fee). An earlier mistaken host-debt backfill created
391 unpaid cash commission rows totalling EUR 19,444.50. The correction initially
retained those rows while excluding them from pending online allocations.
For visual testing, the user explicitly requested removing the earlier
simulated flat-fee history of the 50 booking-fee listings. A development-only
migration deleted those 50 receipts (one already refunded) and their revenue
aggregate entries together. Listing states and bookings were unchanged. The 51
flat-fee listings retain EUR 15,300 in simulated earnings. The user then explicitly
approved converting the 202 completed seed bookings on booking-fee listings from
cash to online and recording simulated successful payments through the normal
`applyBookingFeePayment` handler. Their existing fee rows now record gross
EUR 94,273, platform EUR 9,427.30 and host EUR 84,845.70, with obsolete legacy
aggregate entries removed. Admin revenue totals EUR 24,727.30. The other 189
unverified cash rows remain excluded from earnings. Frozen prices and commission
terms, listing states, 392 booking records and the one cancellation were preserved.
The temporary migrations and their tests were removed after verification. No real
money moved; production cash/online payment rules did not change.
Normal plan changes still preserve payment history. Cash commission collection still needs
its own product rule; cash received directly by the host cannot create a verified
online split.

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

## Payout prerequisite

Payment and payout readiness are independent. A paid flat-fee listing, booking-fee
listing or admin-granted free listing stays hidden until the owner's Better Auth
`user.payoutsEnabled` is true. Missing legacy user values require setup. Listing
records do not store payout readiness. One verified host account enables all their
current and future listings, subject to each listing's billing and publication choice.

The owner list links to `/host/settings?tab=payouts` after any required listing payment.
The payouts tab currently logs setup requests and cannot enable payout readiness. A
future provider integration must verify the receiving account server-side before
setting `user.payoutsEnabled`.

Public backend reads resolve readiness from the listing owner's user. Search/map use
an async filter on bounded indexed pages and reuse one readiness read per owner per
query. Pagination cursors and read limits are preserved. Existing bookings, billing
entitlements and publication choices remain independent of payout-provider setup.
