# Cancellation policy system design

## Current policy choices

Hosts select one fixed policy when creating or editing an accommodation:

| Policy             | Full-refund cutoff                                   | After cutoff |
| ------------------ | ---------------------------------------------------- | ------------ |
| Flexible (default) | 24 elapsed hours before scheduled check-in           | No refund    |
| Moderate           | 120 elapsed hours (5 days) before scheduled check-in | No refund    |
| Firm               | 168 elapsed hours (7 days) before scheduled check-in | No refund    |

Exactly at the cutoff, a full refund still applies. One millisecond later, no
refund applies. Booking close to arrival does not introduce a grace period.
Guest self-service cancellation ends at the scheduled check-in instant.
During-stay changes and early-departure adjustments are separate support work.

New listing inputs store `{ version: 1, mode: 'flexible' | 'moderate' | 'firm' }`.
The version identifies the policy document shape, not a production release.
There is no new custom schedule or partial-refund choice. Creation, Continue,
Publish and owner policy edits validate the same shared schema server-side.
Editing unrelated listing sections preserves the current policy.

## Booking agreement and display

`createBooking` requires `expectedCancellationPolicy`, compares it with the
stored listing, and rejects a changed policy before creating the booking.
The accepted policy, original total/currency, IANA timezone, scheduled check-in
and checkout instants are frozen in `cancellationTerms`. New preset bookings
also freeze the exact `refundDeadlineAt`. Later listing changes, loyalty changes,
or policy configuration changes do not change accepted refund rights.

Cutoffs use elapsed hours, not local calendar-day subtraction. Each deadline is
shown in the accommodation timezone with the offset applicable to that instant.
Ambiguous or nonexistent local check-in times are rejected. The shared
`checkBookingCancellationRefund` supplies the percentage; the shared
`calculateBookingRefundAmount` calculates integer minor units with half-up rounding.
Checkout uses the final discounted stay total. Booked views use the frozen total.

The host selector explains each preset in one sentence. Property details show
its full schedule. Checkout, confirmation, recovered bookings and cancellation
review show the applicable refund and local deadline. Eligible guest views show
the refundable amount now. Closed bookings show historical terms without an
active refund offer. Existing display components and the standard Price component
are reused; no payment-specific UI or Stripe integration is introduced here.

## Development data and backfill

The read model retains previous `full_refund` and `custom` schedules because
existing bookings must retain their accepted terms. New host submissions only
accept the three presets. This read support is necessary for recorded agreements;
it is not an alternate host editor.

`getMatchingCancellationPreset` compares complete outcome schedules. The bounded,
repeatable `backfillCancellationPresets` migrations convert only identical
schedules. The booking migration freezes the mathematically identical cutoff.
An unknown mapping is left unchanged; a partial refund is never silently converted
to zero or full. Existing frozen deadlines are preserved on reruns.

Development audit on 2026-10-09 found:

- 101 listings: 100 full-refund mode, one custom schedule with every range at 100%.
- 394 bookings: 392 full-refund mode, two custom schedules with every range at 100%.
- None has an exact equivalent among the three new presets.

Approved mapping applied on 2026-10-09: all 101 development listings now use
Flexible for future bookings. `backfillFullRefundListingsToFlexible` converts
previous full-refund mode and custom schedules with every range at 100%; it
preserves other policies and is safe to rerun. All 394 accepted booking snapshots
remain unchanged, verified by matching before/after checksums. New listings
also default to Flexible.

## Cancellation lifecycle and financial boundary

An unapproved request can be withdrawn without a cancellation penalty. Pending
requests expire after 24 elapsed hours or scheduled check-in, whichever is sooner;
expiration is distinct from cancellation and creates no refund obligation.
Guest cancellation checks ownership, reason, server time, reviewed status and
reviewed refund percentage. Crossing a deadline during review requires reviewing
again. Cancellation history and notification scheduling commit atomically.
Anonymous guests must claim a booking before cancelling it.

Host cancellation entitles the guest to a full refund regardless of preset.
The existing host status action is not a money-processing operation. Mandatory
host reasons, emergency support workflow, no-show reporting/contest handling,
payment collection, actual refunds, provider fees and host payout recovery remain
separate implementations. No-show policy should use the late-cancellation outcome
for new presets, but no no-show reporting or charging endpoint is added here.

The platform currently collects no guest accommodation payment. UI must retain
that distinction: a policy entitlement or displayed refundable amount does not
prove money was collected or returned. Never infer collection from booking status.

## Verification

Cover all three cutoffs at the boundary and immediately before/after it, last-minute
bookings, DST changes, frozen deadlines, exact mapping and non-matching schedules,
integer-cent refund amounts, rejected old custom writes, stale policy submission,
policy edits after booking, authorization, deadline changes during cancellation
review and preservation of previous accepted schedules. Run the full Convex/pure
unit suite, Svelte type checking, the Svelte autofixer, formatting and
`bunx --bun oxlint`.
