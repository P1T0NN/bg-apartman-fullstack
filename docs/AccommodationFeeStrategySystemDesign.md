# Accommodation fee strategy

## Decision and scope

Allow hosts to move between `booking_fee` and `flat_fee`, with a lock while a
paid flat-fee period is running. Selecting an unpaid flat fee immediately hides
the accommodation. Switching back to booking fees restores its billing eligibility.

This is a reasonable commercial policy: hosts can reconsider an unpaid choice,
while a paid flat-fee period has a clear start and end. The tradeoff is that a host
loses visibility while checking out. Explain that consequence before saving the
switch, and make returning to booking fees easy if checkout is abandoned.

Settings now implements owner-authenticated plan switching, its confirmation,
visibility changes and the paid-period lock. Real payment collection remains deferred. The config-controlled payment
preview (`ACCOMMODATION_PAYMENT_SIMULATION`) grants the stored paid interval and schedules matching-period expiry. The existing
creation flow and required billing fields are described in
[AccommodationBillingSystemDesign.md](./AccommodationBillingSystemDesign.md).

## Transition rules

| Current state                         | Host action or event           | Result                                        | Public visibility                      |
| ------------------------------------- | ------------------------------ | --------------------------------------------- | -------------------------------------- |
| Active `booking_fee`                  | Choose `flat_fee`              | `flat_fee`, `pending_payment`; no paid period | Hidden immediately                     |
| Unpaid `flat_fee`                     | Choose `booking_fee`           | `booking_fee`, `active`                       | Visible if the host wants it published |
| Unpaid `flat_fee`                     | Complete valid payment         | `flat_fee`, `active`; start paid period       | Visible if the host wants it published |
| Paid `flat_fee`, period still running | Choose `booking_fee`           | Reject; retain current plan and period        | Unchanged                              |
| Paid `flat_fee`                       | Period expires without renewal | `flat_fee`, `pending_payment`; renewal is due | Hidden                                 |
| Expired `flat_fee`                    | Choose `booking_fee`           | `booking_fee`, `active`; clear current period | Visible if the host wants it published |
| Expired `flat_fee`                    | Complete valid renewal payment | `flat_fee`, `active`; start a new paid period | Visible if the host wants it published |
| Any state                             | Choose the current plan again  | No change                                     | Unchanged                              |

The lock applies when server time is strictly before the paid period's end. At
the exact end timestamp, the host can switch to `booking_fee`, even if the expiry
job has not run yet. Merely choosing `flat_fee` never starts or locks a paid period.

There is no automatic fallback to booking fees after expiry. The host chooses
between paying again and switching plans. This design assumes manual renewal;
automatic renewal would require a separate product decision.

## Terms and paid periods

Reuse the existing `ACCOMMODATION_BILLING_PLANS` configuration and required
`billingPlanId`, `billingTerms` and `billingStatus`. A switch accepts a plan name,
and the server copies that plan's current terms. Never accept prices, commission
rates, payment status or period dates from the client.

The current flat fee is EUR 300 for three months. Start the paid period when
payment is confirmed, not when the listing is created or checkout is opened.
Calculate its end from the accepted interval. Three calendar months must not be
silently treated as 90 days; use an explicit calendar rule or the payment system's
authoritative period boundaries. Preserve an already-paid period when prices or
configuration change. A later renewal accepts the terms displayed for that renewal.

The following fields support switching and payment handling:

| Field                   | Type                      | Meaning                                                                                        |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `billingPeriodStartsAt` | Required `number \| null` | UTC start timestamp of the latest paid flat-fee period; null before payment or on booking fees |
| `billingPeriodEndsAt`   | Required `number \| null` | UTC end timestamp; the authoritative deadline for the paid-period lock                         |

Keep the last paid period's timestamps after expiry so the host can see when it
ended. Clear them when switching to booking fees. New unpaid flat-fee listings
start with both timestamps null. Payment attempts and prior paid periods belong
in separate records when payments are added; do not grow history arrays on listings.

`billingPeriodEndsAt` is required and nullable before payment.
`status` preserves the host's publication choice. The development migration
restored this choice from the legacy field and removed that field across 101
accommodations. Add `billingPeriodStartsAt` only when payment handling needs it.
Null represents a period that does not exist; it is not an optional legacy fallback.

The standard booking commission is 10% of the discounted stay total, rounded
half up once per booking. Rates are required numeric values; zero represents an
explicit admin waiver. Collection and cancellation/refund policies remain
separate from the immutable snapshot.

## Visibility and host controls

Accommodation `status` stores the host's publication choice: published, unpublished
or deleted. Billing switches and future payment webhooks never overwrite it.
Public eligibility requires published status, active billing and, for flat fees,
a non-null paid-period end strictly later than server time. Search and map queries
apply these conditions before pagination; direct public reads and new bookings
use the shared `isAccommodationVisible` guard.

The publish toggle remains available while billing hides a listing. A host can
pause an unpaid listing, switch back to booking fees and keep it paused. Resuming
while payment is due records the choice but cannot bypass billing eligibility.
Host workspace access and management of existing bookings remain available.
Switching plans does not cancel or decline existing bookings.

## Backend implementation

The owner-authenticated `changeAccommodationBillingPlan` mutation is implemented
under the existing accommodation mutations directory. Its shared operation schema
lives in `schemas/accommodationSchemas.ts`. Reuse the existing identity,
validation, rate limiting and localized backend error patterns.

The mutation reads the accommodation, rejects deleted or unowned records, checks
the paid-period lock against server time, and writes the accepted terms, billing
status and current period atomically, preserving publication choice. Ordinary listing edits continue
to exclude all server-owned billing fields. The backend enforces the lock even
when a client bypasses or has an outdated UI.

After payment confirmation, schedule expiry for the saved end timestamp. Before
expiring a listing, verify that it still uses `flat_fee` and that the period end
matches the one the job was scheduled for. A stale job must not expire a renewed
period or a listing that has moved to booking fees.

Use a bounded reconciliation job for missed expiries, querying an index on
`billingPlanId`, `billingStatus` and `billingPeriodEndsAt`. Public reads also check the paid-period deadline using server time.
Scheduled processing can have a short delay; new booking mutations must also
reject an expired paid period using server time, even before the expiry job runs.

Switching and payment confirmation must resolve races transactionally. When a host
abandons flat fees and returns to booking fees, invalidate any open flat-fee payment
attempt. A late payment confirmation must not silently force that host back onto
flat fees. Resolve a payment received for an invalidated attempt through the
payment integration's refund/support flow. Duplicate confirmations cannot grant
multiple periods, and deleting a listing cannot be reversed by a payment event.

## Existing bookings and commissions

Freeze the applicable fee terms when each booking is created. A pending booking
keeps those terms when the host confirms it. Plan changes, renewals and expiry
never rewrite fees on earlier bookings.

For this policy, a booking created during a valid paid flat-fee period has no
booking commission, even when its stay occurs after that period ends. A booking
created under `booking_fee` retains its commission if the host later buys a flat
fee. This rule prevents switching plans to remove fees from existing bookings.
Cancellation and refunds use the booking's frozen terms when collection is added.

## Host experience

Plan changes live in Accommodation fees under the Settings tab, separate from listing details.
Show the selected plan, price or commission, billing state and paid-through date.

- Before switching from booking fees, state: "Your accommodation will be hidden
  until you pay the flat fee. You can switch back to booking fees at any time
  before payment."
- For unpaid flat fees, show "Pay to activate" and "Switch to booking fees".
- During a paid flat-fee period, show "Paid until {date}" and explain that switching
  becomes available on that date. A disabled control alone is insufficient.
- At expiry, show "Renew to activate" and "Switch to booking fees".
- After returning to booking fees, confirm whether the listing is visible or
  remains paused because of the host's publish choice.

Use component-owned translation keys and the existing form, mutation and error
handling patterns. Confirmation copy must describe the immediate visibility change.

## Verification when implemented

Test both directions before payment, the lock just before expiry and switching at
the exact deadline. Verify published, paused and deleted listings independently.
Cover abandoned checkout, late payment confirmation, duplicate payment events,
renewal followed by a stale expiry job, and expiry before its scheduled job runs.
Verify that existing pending and confirmed bookings retain their original fees.

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

## Implemented booking-fee preparation

New bookings freeze required `platformFeeTerms` with the selected fee model,
commission rate, discounted stay total, calculated fee and currency. Standard
commission is 10%, rounded half up once per booking in integer minor units.
Eligible flat-fee and free bookings freeze a zero commission; expired temporary
free grants resolve to booking fees even before their expiry job executes.
Later plan changes and booking lifecycle updates preserve the snapshot.
Historical snapshots are required null because their accepted fee terms were not
recorded. This is not an exemption or evidence of collection. See
[AccommodationBillingSystemDesign.md](./AccommodationBillingSystemDesign.md#booking-commission-snapshots)
for migration steps and the remaining collection, refund and cash-payment policies.
