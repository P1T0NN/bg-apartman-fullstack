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
  On development, Pay now records a simulated payment without charging money.
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
  Real payments remain deferred. Simulation grants the stored interval in UTC
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

## Development payment preview

`mutations/payFlatFeeAccommodation` is an owner-authenticated simulation gated by
the shared config constant `ACCOMMODATION_PAYMENT_SIMULATION = true`.
It is currently enabled in `src/shared/features/accommodations/config.ts`. The client sends only the
accommodation ID; accepted stored terms determine the period. Calling it again
during an active term does not extend the term. Renewing after expiry starts a
fresh period from server time.

The mutation sets active billing and its end timestamp without changing the
host's publication status. `expireFlatFeeAccommodation` is an internal scheduled
mutation that marks the matching expired period pending payment. Early or stale
jobs, different plans and deleted listings are ignored. Public access checks the
deadline independently so scheduler delays cannot allow new bookings.

The feature `AccommodationFlatFeePaymentButton` is used in My accommodations and
Settings. No Stripe session or charge is made.
Set `ACCOMMODATION_PAYMENT_SIMULATION` to false before enabling real payments; replace the public simulation
entry point with checkout and verified webhook fulfillment when payments ship.

## Stripe integration later

Use a server-owned mapping from our offer ID to Stripe Price ID. Never accept an
amount, commission percentage, Stripe Price ID or payment-confirmed flag from the
browser. An authenticated action checks accommodation ownership and creates a
Checkout Session for that accommodation. Pay to activate then redirects to the
returned Checkout URL. Do not activate a listing from a success-page visit.

Decide whether the three-month fee renews automatically or buys one three-month
term. For automatic renewal use Stripe Billing with a quarterly recurring Price
and subscription Checkout; for a fixed term use one-time Checkout. The current
terms intentionally do not promise automatic renewal.

Keep billing operational history in separate tables when integration starts:
host/customer linkage, accommodation subscriptions or paid terms, payment attempts
and processed webhook event IDs. Index actual lookups (provider IDs and
accommodation ID), keep histories paginated, and deduplicate webhook events.
Do not place growing payment arrays or every Stripe state on accommodations.

A verified webhook updates billing entitlement in one internal
mutation. Set authoritative paid-period timestamps then; payment expiry and renewal failure must
remove public eligibility. Preserve a host's deliberate pause and deletion when
renewal events arrive. Do not assume `active` lasts forever for a paid listing.

Booking creation already snapshots the commission terms and calculated integer
fee on the discounted stay total. Before collecting it, define how future taxes
and extras affect the base and how cancellations adjust collection or refunds. Cash bookings need a separate collection/reconciliation policy;
Stripe cannot automatically deduct commission from money paid directly to a host.
Use Stripe Connect when online guest payments are routed to hosts, and keep host
listing subscriptions separate from those guest payments.

References: [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment),
[recurring Prices](https://docs.stripe.com/api/prices/create),
[Connect destination charges](https://docs.stripe.com/connect/destination-charges).

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

## Admin flat-fee refund preview

`refundFlatFeeForAccommodation` is admin-only and uses the same shared config
simulation flag as payment. It accepts the accommodation ID and the paid-period
end and update timestamp reviewed by the admin. It rejects deleted, unpaid,
expired, non-flat-fee or changed records. It clears the paid period and sets
pending payment without changing terms, publication intent or existing bookings.
The admin table offers a destructive Refund fee confirmation for active paid
flat fees. Previous expiry jobs cannot affect the cleared period.

This is an entitlement preview, not a money refund or payment history. When
payments are integrated, target a recorded payment ID, record a refund request,
call the provider from an admin action, and revoke entitlement only after a
verified successful refund. Store provider refund IDs and processed events to
avoid duplicate refunds. Admin grants are not proof of a refundable payment.

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
