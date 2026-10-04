# Cancellation policy system design

Status: chunks 1 through 4 implemented on October 3, 2026; chunk 4 awaits user review.
Research checked on October 2, 2026. Follow [CodingRules.md](./CodingRules.md),
[ProjectCodingRules.md](./ProjectCodingRules.md), and the existing
[BookingPageDesign.md](./BookingPageDesign.md).

## Scope and user requirements

- Add a dedicated **Cancellation Policy** step to accommodation creation and a
  section with the same name to listing editing.
- Hosts choose full refund, 50% refund, or no refund for cancellation close to
  check-in, using the proposed 24-hour, 3-day, 5-day, and 7-day thresholds.
- Time before check-in and refund amount appear as separate pieces of the UI.
- Hosts may skip custom restrictions. The default is full refund, not an
  unspecified or missing policy.
- Show the policy clearly on the accommodation page and before booking.
- Guests can cancel without requesting host approval; the policy determines
  the refund rather than whether cancellation is permitted.
- Both guest and host cancellation require a reason, stored as
  `cancellationReason` on the booking.
- Host cancellation before check-in always entitles the guest to a full refund
  of the amount collected, independent of the guest cancellation policy.
- Host cancellation within 24 hours of check-in uses **Emergency cancellation**
  and automatically creates a support case. Cancellation remains self-service;
  it does not wait for support approval.
- During-stay cancellation, early-departure adjustments, and refunds are out of
  scope for this version. Host penalties are deferred to
  [TODOProduction.md](./TODOProduction.md).

## Agreed implementation chunks

Implement one chunk at a time, then stop for user review before proceeding.
Stripe, monetary refund calculations, payment records, and refund processing
are outside these chunks and will be implemented separately. Refund selections
are strictly **No refund (0%)**, **50% refund**, or **Full refund (100%)**;
arbitrary percentages are never accepted by the editor or server.

| Chunk                                      | Implementation                                                                                                                                                                                                                                                                                                                                                       | Review checkpoint                                                                                 | Status                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1. Policy values and listing editor        | Shared versioned policy schema, explicit full-refund default, four fixed custom ranges, decreasing-or-equal percentage validation, accommodation DB field, owner update validation, and the Cancellation Policy editing section with live preview. New listings receive the default; existing listings are backfilled with full refund and the DB field is required. | Change values, save, reload, check validation and mobile layout.                                  | Reviewed; chunk 2 authorized        |
| 2. Accommodation creation                  | Dedicated policy step, draft defaults, Continue/Publish validation, review-step summary, and custom policy persistence through createAccommodation.                                                                                                                                                                                                                  | Create listings with default and custom policies.                                                 | Reviewed; chunk 3 authorized        |
| 3. Timezone and booking snapshots          | Validated property timezone, authoritative check-in instant, immutable policy/version/timezone/check-in snapshot when requesting a booking, and explicit safe handling for existing bookings.                                                                                                                                                                        | Verify deadlines and that listing edits do not change accepted booking terms.                     | Reviewed; chunk 3b authorized       |
| 3b. Property-time lifecycle consistency    | Align booking completion and review eligibility with frozen property-local checkout; snapshot the checkout time/instant for new bookings, explicitly handle legacy bookings, and reuse shared date conversion helpers.                                                                                                                                               | Verify midnight, checkout-time and DST boundaries; listing edits must not change booked checkout. | Reviewed; chunk 4 authorized        |
| 4. Guest policy presentation               | Policy on accommodation details, checkout, confirmation, and booking details, with actual deadlines and the immediately applicable percentage for selected dates.                                                                                                                                                                                                    | Review placement, clarity, and last-minute booking behavior.                                      | Reviewed; visual polish implemented |
| 5. Guest cancellation                      | Mandatory reason dialog, authenticated ownership, pre-check-in eligibility, atomic cancellation metadata, notifications, and withdrawal wording for pending requests.                                                                                                                                                                                                | Cancel eligible bookings and verify prohibited actions are blocked.                               | Implemented, awaiting review        |
| 6. Host cancellation and emergency support | Mandatory reason on every host cancellation path, emergency wording within 24 hours, atomic support-case creation, authorized queue with assignment/resolution, and reliable notifications/alerts.                                                                                                                                                                   | Review ordinary and emergency cancellation end to end.                                            | Not started                         |

Each chunk includes its relevant validation and tests, including
`bunx --bun oxlint`. Cancellation screens must state **No payment was collected**
until a separate payments implementation exists. Chunk 1 only configures terms;
booking enforcement and exact deadlines start in later chunks.

### Chunk 1 implementation record

- Review in **Host → My accommodations → open a listing → Listing → Booking
  details → Cancellation Policy**. Modes and percentages edit the draft; Save
  persists it and Cancel discards it. Custom values are preserved when switching
  modes within the same draft, but saving full-refund mode stores only that mode.
- DB shape: `cancellationPolicy` stores `{ version: 1, mode: 'full_refund' }` or
  `{ version: 1, mode: 'custom', fiveToSevenDays, threeToFiveDays,
oneToThreeDays, under24Hours }`. Custom fields contain numeric 100, 50, or 0.
  Seven days or more always means 100%. The field is required in the DB schema.
  A bounded migration fills missing
  policies on existing listings with full refund, preserving custom terms.
  The owner query returns the stored policy directly. New listings and seed
  data explicitly store the default.
- `updateAccommodation` checks ownership and policy validity on the server.
  Saving another section preserves the existing policy. No booking terms,
  cancellation behavior, timezone calculation, or financial enforcement changes
  in this chunk.
- Validation: all 93 tests passed, including all 81 possible custom schedules,
  invalid percentages, ownership, legacy defaults, save/reload, and preservation
  across section updates. Oxlint and the Svelte-aware check passed; the Svelte
  autofixer reported no issues. Convex development schema/functions were pushed
  successfully. Plain `tsc --noEmit` reports existing Svelte-component export
  errors; `bun run check` reports zero errors and zero warnings.
- Chunk 1 reviewed; the user authorized chunk 2 on October 3, 2026.

### Chunk 2 implementation record

- Review in **Host > Add accommodation**. Cancellation Policy is step 7,
  between House Rules and Review (step 8). It reuses the listing editor and its
  child components. Drafts start in full-refund mode with all four custom values
  initialized to 100%. Switching modes or moving between steps preserves draft
  values; nothing is stored until Publish.
- Continue validates the policy section. Review shows the selected policy using
  the existing preview, with a Cancellation Policy button to return to its step.
  Publish requires all seven section schemas to pass, including the policy.
  Inactive custom fields are stripped when publishing full-refund mode.
- `createAccommodation` accepts the required policy, validates it through
  `saveAccommodationSchema`, and persists the normalized result instead of
  replacing it with the default. Existing ownership, upload claiming, and atomic
  publication checks remain in place. The photo upload field stays mounted and
  appears on Photos and the new Review step; submission is restricted to Review.
- Verification: all 96 tests passed, including custom-policy publication and owner
  reload, required policy fields, invalid percentages and increasing schedules,
  inactive-field stripping, and rollback with uploads preserved on failure.
  `bun run check` reports zero errors and zero warnings; Oxlint passes.
  Convex development functions pushed successfully. Plain `tsc --noEmit` still
  reports the existing Svelte-component named-export errors in UI barrels.
- Chunk 2 reviewed; the user authorized chunk 3 on October 3, 2026.

### Chunk 3 implementation record

- **Property timezone** is required and derived from the map pin in creation's
  Location step and the owner listing's Location editor. It appears as a read-only
  input there and in House Rules, and on creation Review. Named IANA timezones
  (including UTC) are validated on the server;
  fixed numeric offsets and invalid names are rejected. No browser timezone or
  automatic country default is used for new properties. Creation drafts deliberately start blank.
- On October 3, 2026, the user required `timeZone` on every property. The development
  backfill populated all 101 existing properties using their stored locations in
  four countries with one timezone each: Serbia (Europe/Belgrade), Hungary
  (Europe/Budapest), Croatia (Europe/Zagreb), and Bosnia and Herzegovina
  (Europe/Sarajevo). Existing valid selections are preserved; unknown countries
  require explicit resolution. The database field is now mandatory, and merged
  section updates reuse `saveAccommodationSchema`. Future seed listings use an
  explicit timezone associated with each known seed city.
- Timezone forms reuse the read-only `AccommodationTimeZone` component. Map pins
  resolve locally in the browser using `lltz`, with a lazy-loaded boundary asset
  from this application's build. No Google Time Zone API or key is required.
  The reusable feature owns loading/retry/stale-result handling; shared timezone
  modules own validation and conversions. Accommodation-specific hooks bind the
  result to form fields. Creation address changes clear the pin and zone.
- Public authenticated upload mutations validate the client-derived zone and
  coordinates. A position change requires both coordinates and a zone together;
  other section edits preserve the stored zone. Server validation proves the zone
  is valid, not that it geographically matches the pin. Multiple-zone locations
  are rejected rather than selecting an arbitrary result.
- Every new booking stores immutable `cancellationTerms`: the versioned policy,
  `timeZone`, `checkInStart`, `checkInAt` (Unix milliseconds),
  `pricePerNightMinor`, and currency. These come from the stored property and
  platform configuration; clients cannot submit their own terms. Request dates
  use the property's calendar, and requests at or after scheduled check-in are
  rejected. Confirmation, completion, claiming, and listing edits preserve the
  original snapshot. Changed terms apply only to subsequent requests.
- Check-in conversion reuses `@internationalized/date`. Nonexistent or repeated
  local times during daylight-saving changes are rejected with a translated
  error rather than silently moving the agreed check-in time. Pure schedule
  helpers subtract 168, 120, 72, and 24 elapsed hours and include exact boundary
  instants in the range starting at that threshold. They return percentages,
  not monetary refunds, and do not change cancellation actions in this chunk.
- Chunk 3b migrated every existing development booking and made its snapshot
  required. Confirmation, guest/recovery details, and guest/host lists return
  the required snapshot directly. There is no missing-snapshot fallback. The
  refund helper returns `null` only at/after check-in.
- Verification: all 102 tests passed. Coverage includes snapshots before/after
  property edits and confirmation,
  forged terms, default/custom policies, legacy reads and edits, timezone
  validation, summer/winter and quarter-hour offsets, DST gaps/folds, property
  dates differing from UTC, elapsed check-in, exact boundaries, and elapsed-hour
  deadlines across a clock change. Convex development functions pushed
  successfully. `bun run check` and Oxlint pass; the Svelte autofixer reports no
  issues. Plain `tsc --noEmit` retains the previously documented Svelte export
  errors in UI barrels.
- Stop here for chunk 3 review. Guest-facing policy schedules are chunk 4;
  guest/host cancellation flows are chunks 5 and 6. Payments remain separate.

### Source of truth

Map pin lookup now runs in the browser. The boundary dataset is emitted by Vite
and downloaded on the first pin lookup, then reused. Generic timezone logic lives
in the two timezone feature folders; project timing rules remain in their domains.

- The browser derives the zone from map coordinates; the server validates the
  submitted identifier. `accommodations.timeZone` remains authoritative for new
  booking requests.
- Once requested, `bookings.cancellationTerms.timeZone`, `checkInAt`, and
  `checkOutAt` are authoritative for that booking's timing. Listing edits never
  replace this snapshot. `src/shared/features/timezone/utils` owns conversions; store IANA
  zones and absolute milliseconds, never a fixed offset as the timezone.
- Completion, review eligibility, and the review deadline use this permanent
  snapshot. Both booking dates remain property-local calendar dates. Store IANA
  zones and absolute milliseconds; a browser zone or a fixed numeric offset is
  never the booking's source of truth.

### Chunk 3b implementation record

- All **392 development bookings** were processed by `backfillBookingTiming`.
  Existing snapshots were preserved. Missing snapshots received the platform's
  full-refund default, with local times and prices from the linked property.
  This adopts explicit terms for pre-policy development records; it does not
  claim that historical guests accepted a current custom policy. No payments
  were collected. Missing checkout fields were filled using the preserved
  snapshot's timezone and the property's checkout time.
- `cancellationTerms`, `checkOut`, and `checkOutAt` are mandatory. The final
  schema was deployed after migration completed successfully. Missing-data
  fallbacks and nullable snapshot contracts were removed from application code.
- New requests validate and snapshot both check-in and checkout instants,
  rejecting DST gaps/folds. Listing edits never change booked timing.
- Host/support completion requires a confirmed booking and server time at or
  after its frozen checkout instant. Reviews additionally require completed
  status, ownership, no prior review, and the existing self-review restrictions.
- The review window ends at the exclusive start of the 90th calendar day after
  checkout in the booking's property timezone. Display its final minute and
  explicit property-local zone. This preserves the calendar-day window while
  correcting its previous UTC boundary.
- Eligible-stay queries use the checkout-instant index and server clock. Browser
  timestamps trigger refreshes only. `useReviewClock` replaces `useReviewDate`
  and refreshes every minute and when the tab becomes visible.
- Browser boundary-asset serving/caching checks are recorded in `TODOProduction.md`.
- Verification: 110 tests pass across 28 files; `bun run check`,
  `bunx --bun oxlint`, Prettier, and the touched Svelte files' autofixer checks
  pass. The required schema and Convex functions deploy successfully. Plain
  `tsc --noEmit` retains the existing 12 Svelte UI barrel export errors.
- Stop here for chunk 3b review; chunk 4 guest cancellation schedules are next.

### Files changed in chunk 3b

Added:

- `src/convex/migrations/backfillBookingTiming.ts`
- `src/features/reviews/hooks/useReviewClock.svelte.ts`
- `tests/convex/bookingTiming.test.ts`
- `tests/fixtures/bookingCancellationTerms.ts`
- `tests/reviewTiming.test.ts`

Updated:

- `docs/CancellationPolicySystemDesign.md`
- `docs/ProjectCodingRules.md`
- `docs/TODOProduction.md`
- `messages/en.json`
- `src/convex/seed.ts`
- `src/convex/tables/bookings/schema.ts`
- `src/convex/tables/bookings/mutations/createBooking.ts`
- `src/convex/tables/bookings/helpers/completeBooking.ts`
- `src/convex/tables/bookings/helpers/enrichBookingPage.ts`
- `src/convex/tables/bookings/helpers/getBookingGuestDetails.ts`
- `src/convex/tables/bookings/queries/fetchBookingConfirmation.ts`
- `src/convex/tables/bookings/validators/bookingValidators.ts`
- `src/convex/tables/reviews/mutations/createReview.ts`
- `src/convex/tables/reviews/queries/fetchEligibleReviewBookings.ts`
- `src/shared/features/bookings/types/bookingTypes.ts`
- `src/shared/features/bookings/types/bookingHostTypes.ts`
- `src/shared/features/bookings/utils/checkBookingCancellationRefund.ts`
- `src/shared/features/reviews/utils/canReviewBooking.ts`
- `src/shared/features/reviews/utils/getReviewDeadline.ts`
- `src/shared/utils/date.ts`
- `src/shared/types/types.ts`
- `src/utils/getBackendErrorMessage.ts`
- `src/features/reviews/components/review-dialog/review-dialog.svelte`
- `src/components/pages/(protected)/guest/my-bookings/my-booking-item.svelte`
- `src/routes/(app)/(protected)/guest/my-bookings/+page.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-reviews/accommodation-review-bookings.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-reviews/accommodation-review-booking-item.svelte`
- `tests/bookingCancellationSchedule.test.ts`
- `tests/convex/bookings.test.ts`
- `tests/convex/bookingRecovery.test.ts`
- `tests/convex/reviews.test.ts`
- `src/convex/_generated/api.d.ts` (generated)

Removed `src/features/reviews/hooks/useReviewDate.svelte.ts`; the permanent
`useReviewClock` hook replaces it.

### Files changed in the earlier map-pin timezone follow-up

Historical inventory: the Google-specific files below were removed by the browser
timezone refactor recorded next.

Added:

- `src/convex/tables/accommodations/actions/createAccommodation.ts`
- `src/convex/tables/accommodations/actions/updateAccommodation.ts`
- `src/convex/tables/accommodations/actions/resolveAccommodationTimeZone.ts`
- `src/convex/tables/accommodations/helpers/resolveAccommodationTimeZone.ts`
- `src/convex/tables/accommodations/queries/assertAccommodationOwner.ts`
- `src/features/accommodations/hooks/useAccommodationTimeZone.svelte.ts`
- `src/components/pages/(protected)/host/my-accommodation/my-accommodation-tab-listing/my-accommodation-tab-listing-location.svelte`
- `tests/accommodationTimeZone.test.ts`

Updated:

- `.convex.example.env`
- `docs/CancellationPolicySystemDesign.md`
- `docs/ProjectCodingRules.md`
- `messages/en.json`
- `src/convex/convex.config.ts`
- `src/convex/tables/accommodations/mutations/createAccommodation.ts`
- `src/convex/tables/accommodations/mutations/updateAccommodation.ts`
- `src/convex/tables/accommodations/validators/accommodationValidators.ts`
- `src/features/accommodations/components/accommodation-time-zone/accommodation-time-zone.svelte`
- `src/features/accommodations/forms/myAccommodationTabListingForm.ts`
- `src/components/pages/(protected)/host/add-accommodation/add-accommodation-form/add-accommodation-form-location.svelte`
- `src/components/pages/(protected)/host/add-accommodation/add-accommodation-form/add-accommodation-form.svelte`
- `src/components/pages/(protected)/host/my-accommodation/my-accommodation-tab-listing/my-accommodation-tab-listing-editor.svelte`
- `src/shared/features/accommodations/schemas/accommodationSchemas.ts`
- `src/shared/types/types.ts`
- `src/utils/getBackendErrorMessage.ts`
- `tests/convex/accommodations.test.ts`
- `src/convex/_generated/api.d.ts` (generated)
- `src/convex/_generated/server.d.ts` (generated)

Removed the unused `src/features/accommodations/utils/getTimeZoneOptions.ts`.
The universal `SearchableSelect` and both starter templates are unchanged in this
follow-up.

## Research and interpretation

[Booking.com's policy codes](https://developers.booking.com/connectivity/docs/codes-bccp)
represent cancellation deadlines and financial consequences separately, including
percentage penalties and a fully flexible option. This supports separating time
and refund in our editor, but does not establish that four editable rows are the
best UI. Their arrival-midnight deadlines also differ from our proposed check-in
anchor; do not copy those semantics accidentally.

[Booking.com's cancellation schedule documentation](https://developers.booking.com/demand/docs/orders-api/cancellation-policies)
provides the complete schedule before booking confirmation and again in booking
details. Our recommendation is to show the full schedule openly on the property
page, repeat it at checkout, and preserve it in the booking record.

[Airbnb's guest cancellation flow](https://www.airbnb.com/help/article/169)
distinguishes cancellation from free cancellation, lets guests see their refund
before cancelling, and addresses cancellation after check-in separately.
[Airbnb's policy documentation](https://www.airbnb.com/help/article/475)
anchors cancellation times to the listing's local timezone and describes
exceptions that may override an ordinary policy.

The layout below is our design recommendation informed by these precedents,
not a tested conversion claim. Use visible labels and programmatic label/control
associations following [W3C form guidance](https://www.w3.org/WAI/tutorials/forms/labels/).

## Resolve overlapping rules

"Less than 24 hours" also satisfies "less than 3 days", "less than 5 days",
and "less than 7 days". Present and evaluate mutually exclusive ranges instead.
The host configures the four ranges below; the earliest range has a proposed
fixed full refund so every pre-check-in instant has an outcome.

| Time remaining before check-in      | Guest refund                             |
| ----------------------------------- | ---------------------------------------- |
| 7 days or more                      | Full refund (100%), fixed recommendation |
| 5 days to less than 7 days          | Host selects 100%, 50%, or 0%            |
| 3 days to less than 5 days          | Host selects 100%, 50%, or 0%            |
| 24 hours to less than 3 days        | Host selects 100%, 50%, or 0%            |
| Less than 24 hours, before check-in | Host selects 100%, 50%, or 0%            |

At exactly 7 days the full-refund range applies. At exactly 5 days, 3 days,
or 24 hours, the range starting at that threshold applies. At or after check-in,
none of these pre-arrival ranges applies.

Recommended validation: refund percentages may stay equal or decrease as
check-in approaches. For example, 100%, 100%, 50%, 50%, 0% is valid; a sequence
that increases from 0% to 100% closer to arrival is rejected with an explanation.
This prevents an incentive to wait before cancelling. This constraint and the
fixed full refund outside seven days are proposed additions to the user's idea.

## Host editor

Use two plainly labelled choices at the top of the new step/section:

- **Full refund before check-in** (default).
- **Set refund amounts by cancellation time**.

Avoid calling the default "No cancellation policy" or "Opt out": it is an
explicit full-refund policy. Supporting text must explain the outcome.

In custom mode, render the table above as rows. Each row has a separate time
label and a `NativeSelect` labelled **Guest refund**, with these options:
**Full refund (100%)**, **50% refund**, and **No refund (0%)**. Say "refund",
not "fee", so hosts cannot confuse money returned with money retained.

The host editor uses the heading **When does the guest cancel?** with
**Time before check-in** below it. Display short range labels: **7+ days**,
**5–7 days**, **3–5 days**, **1–3 days**, and **Final 24 hours**. Each editor row
includes a concrete example (10 days, 6 days, 4 days, 2 days, or 12 hours before).
Keep a visible note below the rows: at exactly 7, 5, 3, or 1 day before
check-in, the range starting at that number applies. These are display changes;
the exact ranges and elapsed-hour rules above remain unchanged.

The custom editor lives in
`accommodation-cancellation-policy-custom/accommodation-cancellation-policy-custom.svelte`;
its keyed rows live in that folder's `accommodation-cancellation-policy-item.svelte`.
Pass only the range and form
context; the item owns its control ID, validation text, options, and change
handler. Item-only translations use
`AccommodationsFeature.AccommodationCancellationPolicyItem`; refund labels are
shared with the live preview. Custom-editor translations use
`AccommodationCancellationPolicyCustom`, mode-row translations use
`AccommodationCancellationPolicyModeItem`, and preview copy uses
`AccommodationCancellationPolicyPreview` under `AccommodationsFeature`.
`accommodation-cancellation-policy-mode-item.svelte` owns each radio control.
`accommodation-cancellation-policy-preview/accommodation-cancellation-policy-preview.svelte`
owns policy validation for the preview and composes
`accommodation-cancellation-policy-preview-item.svelte` with only the range and
refund percentage. The main component composes these sections and selects the
custom mode; it does not own child-only validation or controls.

Keep the four thresholds fixed for this version. Separate time and amount
columns satisfy the requirement without introducing editable deadlines,
duplicate thresholds, add/remove controls, or gaps. If editable days are wanted
later, that is a separate decision with ordering and uniqueness validation.

Initialize the custom refund values at 100%. Include a live plain-language
preview of what the guest will see. Show validation beside the affected row;
do not silently change other selected percentages. On mobile, stack the time
label above its refund selector and preserve chronological order.

Reuse the existing form step/section infrastructure and protected UI primitives.
The new section participates in step validation, final publication validation,
the review step, and owner section saving. Switching modes edits the draft;
only the existing save action persists it.

## Guest presentation

On accommodation details, place a short policy summary near the price and
booking action, with a visible **Cancellation policy** section containing the
full schedule. Do not put the only copy in a tooltip, modal, or collapsed panel.

When dates are selected, show actual deadline dates, times, and the property's
timezone alongside the refund outcomes. Merge adjacent ranges with the same
percentage in the guest summary to avoid repeating identical terms. Keep the
host editor's four rows intact.

Chunk 4 must use explicit wording such as **Full refund until 12 October at
14:00, property local time in Belgrade**. Display the offset for the deadline
instant, including its daylight-saving rules, rather than today's offset or the
guest's browser zone. Accepted bookings display their frozen terms.

Repeat the schedule before the booking submission action and on confirmation
and booking details. Explain that cancelling is still possible after the
full-refund deadline. For a last-minute booking, visibly identify the refund
that applies immediately; do not imply a free-cancellation period already passed
is still available.

The cancellation dialog shows the property, dates, mandatory **Why are you
cancelling?** textarea, applicable refund, and a clear confirmation action.
Show currency amounts only when a server-authoritative payment/refund quote
exists. The current app takes no payment: say **No payment was collected**
instead of inventing a refund or promising a bank transfer.

## Timing and accepted terms

Anchor the policy to the booked check-in date and `checkInStart`, interpreted
in a validated IANA timezone required on every accommodation. New properties
derive their zone from the map pin in the browser and validate the submitted IANA identifier on the server; existing development properties were backfilled from
their verified single-timezone countries. Do not use the guest's browser timezone
or infer new property timezones solely from country.

For this proposal, one day means 24 elapsed hours: thresholds are 24, 72, 120,
and 168 hours before the check-in instant. Calculate using timestamps and
display deadlines in property local time, including daylight-saving changes.
Calendar-day subtraction is a different policy and must not be mixed in.

Snapshot the policy version, selected mode/percentages, timezone, check-in
anchor, and any authoritative pricing terms when the booking request is
created. Later listing edits affect new requests only. Host confirmation must
not replace the policy the guest saw when submitting the request.

## Guest cancellation eligibility

Pending requests can be withdrawn without a cancellation charge; they have not
been accepted. Confirmed future bookings can be cancelled immediately by their
guest, with the accepted policy determining any refund. Mandatory reason does
not imply mandatory host approval.

"At any time" must not mean undoing a completed stay. Already cancelled,
declined, or completed bookings cannot be cancelled again. Preserve history
rather than deleting the booking.

Cancellation is available only before the booked check-in instant in this
version. At or after that instant, neither party gets an ordinary cancellation
action, even if the booking is still labelled confirmed. There is no actual
arrival tracking yet, so eligibility uses scheduled check-in rather than an
assumption that the guest entered the room.

If a guest stays for two days and leaves early, do not cancel the booking,
recalculate its price, issue an automatic refund, or create an emergency case
from that departure. The guest can review through the existing verified-review
flow when eligible. This does not grant immediate review eligibility: preserve
completed-booking, checkout-date, and review-window checks. No new during-stay
refund or termination system is planned for this version.

No-show processing and any future early-departure/refund system need separate
designs. This scope decision does not override applicable statutory rights or
turn an unresolved safety issue into a refund-policy calculation. Do not
introduce an additional grace period without a product decision.

## Host cancellation rules

These are platform rules, not settings the host can customize. The host's
guest cancellation percentages never reduce a refund when the host cancels.

| Booking stage                                 | Host action                            | Outcome                                                                             |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| Pending request                               | Decline request                        | Status becomes `declined`; no confirmed-booking emergency case                      |
| Confirmed, more than 24 hours before check-in | Cancel booking                         | Status becomes `cancelled`; full refund of collected funds; notify guest            |
| Confirmed, within 24 hours before check-in    | Emergency cancellation                 | Same cancellation and full refund; also create an urgent support case automatically |
| At or after scheduled check-in                | No cancellation action in this version | No during-stay cancellation/refund workflow                                         |
| Declined, cancelled, completed, or stay ended | No cancellation action                 | Preserve booking history                                                            |

Emergency means more than zero and at most 24 hours remain. Exactly 24 hours
belongs to the emergency path. Reuse the booking's immutable check-in instant
and server time for both UI eligibility and mutation validation. If the dialog
was opened earlier and the threshold has since passed, require the host to
review the emergency wording before committing; do not silently submit a
different action with consequences the host has not seen.

Both confirmed cancellation paths require the mandatory `cancellationReason`
and record the server-derived actor and timestamp. Pending host refusal is a
decline, not a cancellation disguised under another label. Hosts must cancel
their own unfulfillable bookings rather than encourage guests to cancel for
them. No automatic fees, ranking deductions, calendar penalties, or account
restrictions are applied for host cancellations in this version.

Full refund means all money collected for that booking through the platform,
including platform-collected fees, with no cancellation deduction and no
remaining booking balance due. No payment integration exists yet; the current
UI must state that no payment was collected. Once payments exist, cancellation
initiates a full refund but must not claim the funds have already reached the
guest's bank. Support response and refund processing are independent.

[Airbnb treats host cancellation within 24 hours as a special support situation](https://www.airbnb.com/help/article/166)
and requires hosts to cancel promptly themselves.
[Its guest protection includes a full refund before check-in](https://www.airbnb.com/help/article/170).
Our self-service cancellation plus automatic support case is a deliberate
platform design choice; it is not a claim that Airbnb uses this exact workflow.

## Emergency cancellation UI

Within the emergency window, replace the host row action **Cancel booking**
with **Emergency cancellation**. The dialog title uses that same wording and
the final action says **Confirm emergency cancellation**.

Suggested explanatory text:

> Check-in is within 24 hours. Cancelling now may leave your guest without
> accommodation. The booking will be cancelled, the guest will be notified,
> and an urgent case will be sent to platform support to help them. The guest
> is entitled to a full refund of any payment collected for this booking.
> Explain why you cannot accommodate the guest. Do not ask the guest to cancel
> on your behalf.

Show the property's name, scheduled check-in date/time and timezone, remaining
time, and mandatory **Why are you cancelling?** textarea. Explain the impact
plainly; do not threaten penalties that do not exist. Adapt the payment sentence
to **No payment was collected** until payments are implemented. Use the existing
accessible dialog and destructive confirmation pattern. Prevent duplicate
submission and close only after successful cancellation.

Guest notification distinguishes a host cancellation from the guest's own
action, explains the refund/payment state, and provides the support contact or
case reference. Do not guarantee a replacement property or response time that
the platform cannot actually provide.

## Emergency support case model

Recommended table name: **`bookingEmergencies`**. Keep booking status
**`cancelled`**; do not introduce **`emergency_cancellation`** as a booking status.
Cancellation describes the booking outcome. The separate case describes
support work that may remain open after the booking has ended.

This separation lets support assign, work, and resolve cases without changing
booking status or complicating existing cancelled-booking filters. It also
allows an indexed queue of unresolved emergencies without scanning booking
history. The performance benefit comes from appropriate indexes and bounded
queries, not merely from adding a table. See
[Convex index guidance](https://docs.convex.dev/database/reading-data/indexes/).

Minimal proposed fields:

- `bookingId`: reference to the cancelled booking.
- `status`: `open`, `in_progress`, or `resolved` for the support workflow.
- `checkInAt`: copied booking check-in instant for queue urgency/order.
- `assignedTo`: optional support identity, assigned through authorized actions.
- `resolvedAt` and `resolutionNote`: populated when support resolves the case.

Reuse the document's creation timestamp; read the cancellation reason and
participants from the booking rather than copying all its personal data into
the case. First-version cases are only for confirmed host cancellations in the
emergency window. Do not create one for every ordinary cancellation, decline,
guest cancellation, or early departure.

Plan a `by_booking_id` index for case lookup/duplicate prevention and a
`by_status_check_in_at` index for paginated support queues ordered by scheduled
check-in. A support overview may compose bounded `open` and `in_progress` pages;
never collect all cases to sort them in memory. Restrict case management and
private support notes to authorized support staff.

In one Convex mutation, validate the host and reason, determine the window,
cancel the booking, record cancellation metadata, and insert one `open` case
when required. These writes commit together. A transactionally checked index
lookup prevents duplicate cases; the index is not itself a uniqueness
constraint. Concurrent retries must not create a second case or refund.

Queue guest notification and support alert delivery reliably from the committed
operation. Case persistence must not depend on email delivery. An external
payment refund cannot be part of the database transaction; once implemented,
use retryable processing with an idempotency key tied to the booking and expose
refund failures for support. A table alone does not provide rapid assistance:
the future support UI, alerts, ownership, and resolution action must be included
in implementation so cases are actionable immediately.

## Booking cancellation record and server responsibilities

Plan these fields on a cancelled booking:

- `cancellationReason`: required, trimmed, non-empty free text for every new
  guest or host cancellation; proposed maximum 1,000 characters.
- `cancelledAt`: server timestamp.
- `cancelledBy`: server-derived actor identity.
- `cancellationInitiator`: guest, host, or support, so responsibility is explicit.
- Applied policy/refund outcome when that calculation is implemented.

These fields are absent on active bookings; conditional requiredness belongs
in cancellation validation, not a requirement for every booking row. Legacy
cancellations without reasons must be identified as legacy; never fabricate
reasons. Reasons are private to authorized participants/support, not public
accommodation content. A guest may use a simple reason such as "Plans changed";
do not require sensitive medical details or evidence for ordinary cancellation.

The server validates identity, booking ownership, allowed status and timing,
and the reason again when committing. Read the booking's policy snapshot,
never a percentage, refund amount, or actor supplied by the browser. Commit
the status and cancellation metadata atomically and prevent duplicate refunds
on retries. Revalidate any refund preview at confirmation if a deadline passed.

Current host status changes go through `updateBookingStatus`; any future host
cancellation through that path must also require the reason. Do not add a new
button while leaving a generic status update able to bypass these rules.
Anonymous booking recovery currently grants read/claim access; it must not
silently gain cancellation authority. First version can require secure claiming
and authenticated ownership before guest cancellation.

## Implementation boundaries and checks

Implementation follows the chunks above; chunks 1 through 3b are authorized.
Planned integration points are the
shared accommodation schemas/types, create form step and review, owner listing
section form, listing create/update validators, public details, booking checkout,
booking creation/snapshot, and guest/host cancellation flows. Keep reusable
policy validation and evaluation in the shared feature; backend authorization
and writes remain in Convex. No new dependency or separate policy table is
needed for a fixed four-range policy. `bookingEmergencies` is a separate support
table, not a table for storing accommodation cancellation policies.

Before financial enforcement, implement authoritative booking pricing,
payment/refund processing, and the agreed refund basis (nightly charges, fees,
taxes, discounts, deposits, and any amount not yet paid). A refund must never
exceed collected funds, and refund percentage alone is insufficient to calculate
what a partially paid guest owes. Today's accommodation estimate is not a
payment ledger.

Implementation checks must cover every threshold and equality boundary,
monotonic validation, default mode, timezone/DST behavior, policy edits after
booking, unauthorized cancellation, missing/blank reasons, terminal states,
confirmation/cancellation races, exactly-24-hour emergency classification,
late host-dialog confirmation, atomic booking/case creation, support
authorization, duplicate cases, and duplicate submissions/refunds. Existing
bookings need an explicit migration plan for missing policy snapshots; do not
retroactively apply a newly restrictive listing policy.

During-stay refunds are explicitly deferred. Host penalties are tracked in
[TODOProduction.md](./TODOProduction.md). Remaining prerequisites before coding
financial enforcement include the authoritative payment/refund model and
timezone resolution; emergency support requires a working queue and alerts.

### Required-policy follow-up

The development backfill scanned 101 listings on October 3, 2026 before the
required schema was deployed. The backfill is idempotent and changes only
missing policies. Run
`migrations/backfillAccommodationCancellationPolicies:backfillAccommodationCancellationPolicies`
with the optional schema still deployed before applying the required field to
another environment containing legacy listings. No bookings were modified.

### Browser timezone refactor

Pin events now resolve locally through `lltz` and populate the read-only timezone
input. The ~45 MiB uncompressed dataset is lazy-loaded and reused. Failed loads can
retry; stale pin results cannot overwrite a newer selection. Reusable modules use
relative imports and have no form, accommodation, translation, or Convex dependency.
See `src/features/timezone/README.md` for copying these folders into another project.
Existing property timezones and permanent booking snapshots are preserved; no
migration is necessary for this refactor. Chunk 4 remains the next chunk.

Added:

- `src/features/timezone/README.md`
- `src/features/timezone/utils/getTimeZone.ts`
- `src/features/timezone/hooks/useTimeZone.svelte.ts`
- `src/shared/features/timezone/schemas/timezoneSchemas.ts`
- `src/shared/features/timezone/utils/isIanaTimeZone.ts`
- `src/shared/features/timezone/utils/getIsoDateInTimeZone.ts`
- `src/shared/features/timezone/utils/getZonedTimestamp.ts`
- `tests/timezone.test.ts`

Edited:

- `package.json`
- `bun.lock`
- `.convex.example.env`
- `messages/en.json`
- `docs/CodingRules.md`
- `docs/ProjectCodingRules.md`
- `docs/TODOProduction.md`
- `docs/CancellationPolicySystemDesign.md`
- `src/features/accommodations/hooks/useAccommodationTimeZone.svelte.ts`
- `src/shared/features/accommodations/schemas/accommodationSchemas.ts`
- `src/shared/utils/date.ts`
- `src/shared/types/types.ts`
- `src/utils/getBackendErrorMessage.ts`
- `src/components/pages/(protected)/host/add-accommodation/add-accommodation-form/add-accommodation-form.svelte`
- `src/components/pages/(protected)/host/my-accommodation/my-accommodation-tab-listing/my-accommodation-tab-listing-editor.svelte`
- `src/components/pages/(unprotected)/book/booking-checkout/booking-checkout.svelte`
- `src/convex/convex.config.ts`
- `src/convex/builders/convexFunctionBuilders.ts`
- `src/convex/tables/accommodations/mutations/createAccommodation.ts`
- `src/convex/tables/accommodations/mutations/updateAccommodation.ts`
- `src/convex/tables/accommodations/validators/accommodationValidators.ts`
- `src/convex/tables/bookings/mutations/createBooking.ts`
- `src/convex/migrations/backfillAccommodationTimeZones.ts`
- `src/convex/migrations/backfillBookingTiming.ts`
- `src/convex/seed.ts`
- `src/convex/_generated/api.d.ts` (generated)
- `src/convex/_generated/server.d.ts` (generated)
- `tests/convex/accommodations.test.ts`
- `tests/fixtures/bookingCancellationTerms.ts`
- `tests/bookingCancellationSchedule.test.ts`
- `tests/reviewTiming.test.ts`

Removed:

- `src/convex/tables/accommodations/actions/createAccommodation.ts`
- `src/convex/tables/accommodations/actions/updateAccommodation.ts`
- `src/convex/tables/accommodations/actions/resolveAccommodationTimeZone.ts`
- `src/convex/tables/accommodations/helpers/resolveAccommodationTimeZone.ts`
- `src/convex/tables/accommodations/queries/assertAccommodationOwner.ts`
- `tests/accommodationTimeZone.test.ts`

Verification: all 110 tests across 28 files pass, including real browser-library
boundary lookups, concurrent asset sharing, retry, ambiguous-zone rejection,
invalid-coordinate rejection, and authenticated database persistence. `bun run
check`, `bunx --bun oxlint`, the changed Svelte files' autofixer checks, and the
production build pass. The built 47,364,980-byte asset was fetched successfully
from local production preview (HTTP 200) and resolved the Belgrade pin.
Development Convex functions deployed successfully. Full authenticated UI pin
interaction still needs the host's review in creation and Location editing.

### Chunk 4 implementation record

Research checked October 3, 2026. Airbnb documents listing-local cancellation
times; Booking.com's developer guidance presents exact deadlines before
confirmation and preserves the accepted cancellation terms; NN/g recommends
keeping the important information visible and disclosing secondary detail.
The placement and wording below are this project's design decisions based on
those sources, not a claim that they prescribe this exact layout:

- [Airbnb cancellation timing](https://www.airbnb.co.uk/help/article/475)
- [Booking.com cancellation policies](https://developers.booking.com/demand/docs/orders-api/cancellation-policies)
- [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

Implementation:

- Accommodation details has a visible Cancellation policy section and a
  navigation link. The booking card repeats the current outcome and next
  deadline beside its action, with a link to the full schedule. Existing
  `checkIn` search parameters produce exact deadlines; without dates, outcome
  wording is chronological: "Until 7 days before check-in", "After that, until
  3 days before check-in", and "After that, before the scheduled check-in time".
- Checkout renders the schedule directly above the submission action, following
  the selected check-in date. Host-only controls and their four rows are unchanged.
- Confirmation, recovery booking details, and My bookings display the permanent
  snapshot. My bookings has a clearly labelled disclosure dedicated to the policy.
  Confirmation now returns booking status so cancelled, declined and completed
  records do not advertise a currently available cancellation outcome.
- Adjacent equal percentages merge into at most three guest-facing periods.
  "If you cancel now" and "Applies now" identify the immediate outcome; expired
  periods show "Deadline passed". There is no new grace period for late requests.
  Until-deadline boundaries are inclusive; scheduled check-in is exclusive.
- Each dated deadline uses its property IANA timezone and its own date-specific
  offset. The time-zone formatter belongs to the reusable timezone feature.
  All thresholds share accommodation configuration and use elapsed hours.
- No payment amounts or refund transactions are introduced. A visible payment
  note explains that percentages describe the policy and no payment is collected.
  Accepted stays explicitly state "No payment was collected". This chunk adds
  presentation; guest and host cancellation actions remain chunks 5 and 6.

Review on accommodation details (with and without selected dates), checkout,
confirmation, My bookings > Cancellation policy and deadlines, and recovery
booking details. Check a custom policy, a stay near check-in, and old bookings
whose property's terms have changed. Stop here for user review before chunk 5.

Files added:

- `src/shared/features/accommodations/utils/displayCancellationPolicyPeriods.ts`
- `src/shared/features/timezone/utils/formatZonedDateTime.ts`
- `src/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte`
- `src/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy-item.svelte`
- `src/features/accommodations/components/accommodation-guest-cancellation-policy/accommodation-guest-cancellation-policy.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-details/accommodation-details-cancellation-policy.svelte`
- `tests/cancellationPolicyPresentation.test.ts`

Files edited:

- `messages/en.json`
- `src/shared/features/accommodations/config.ts`
- `src/shared/features/bookings/utils/calculateBookingCancellationDeadlines.ts`
- `src/shared/features/bookings/utils/checkBookingCancellationRefund.ts`
- `src/convex/tables/bookings/queries/fetchBookingConfirmation.ts`
- `src/convex/tables/bookings/validators/bookingValidators.ts`
- `src/components/pages/(unprotected)/accommodation/accommodation-details/accommodation-details.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-details/accommodation-details-rules.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-navigation.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-summary/accommodation-summary.svelte`
- `src/components/pages/(unprotected)/book/booking-checkout/booking-checkout.svelte`
- `src/components/pages/(unprotected)/book-confirmation/booking-confirmation-details.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details-dialog/find-booking-details-dialog-content.svelte`
- `src/components/pages/(protected)/guest/my-bookings/my-booking-item.svelte`
- `tests/convex/bookings.test.ts`
- `src/features/timezone/README.md`
- `docs/ProjectCodingRules.md`
- `docs/CancellationPolicySystemDesign.md`

Verification:

- New tests exercise every valid decreasing schedule, merged/exact boundaries,
  immediately applicable last-minute outcomes, single-period policies, DST and
  quarter-hour offsets. Existing tests verify accepted snapshots after listing
  edits, including confirmation's booking status.
- Svelte checks and all 12 touched Svelte files' autofixer checks pass. The
  production build passes and the updated Convex confirmation query deploys.
- Isolated browser checks verify the public property's dated policy, the booking
  card summary, and checkout placement. The policy itself fits a 390px viewport.
  An existing protected header action row extends outside that viewport; the
  header remains unchanged. Authenticated My bookings and recovery interactions
  need the user's review; their integration is checked by Svelte validation.

Final checks: **114 tests pass across 29 files**. `bun run check`,
`bunx --bun oxlint`, Prettier on the changed files, and the production build pass. No migration was
needed. Previous "terms not provided" placeholders and the duplicate checkout
payment-method placeholder were removed; the policy's payment note remains.

The full-repository Prettier check also flagged the concurrently added,
unrelated `src/hooks/useActiveSection.svelte.ts`; it was left unchanged.

Cancellation policy types are centralized in `src/shared/features/accommodations/types/cancellationPolicyTypes.ts`. Guest display periods are produced by `displayCancellationPolicyPeriods`. The guest policy preview refreshes its current refund and expired deadlines every second and when the tab becomes visible.

### Chunk 4 accommodation policy visual polish

The accommodation details policy section uses a vertical timeline with prominent
refund percentages, connected markers, and an outlined current period with an
"Applies now" badge. Property-local deadline wording and the live refresh remain
unchanged. The payment explanation is a separate note below the schedule. The
presentation is enabled only for the accommodation details section; compact
summaries, checkout, and existing-booking views keep their current presentation.
No files were added. Edited:

- `src/components/pages/(unprotected)/accommodation/accommodation-details/accommodation-details-cancellation-policy.svelte`
- `src/features/accommodations/components/accommodation-guest-cancellation-policy/accommodation-guest-cancellation-policy.svelte`
- `src/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy.svelte`
- `src/features/bookings/components/booking-cancellation-policy/booking-cancellation-policy-item.svelte`
- `docs/CancellationPolicySystemDesign.md`

Visual verification uses an isolated preview of the actual component: custom
and full-refund policies, selected and unselected dates, desktop, 390px mobile,
and dark mode. The policy fits the viewport without horizontal scrolling.
Chunk 5 remains unstarted; stop for review of this visual polish.

### Chunk 5 implementation record

Review in **Guest ? My bookings**. Pending requests show **Withdraw request**;
confirmed stays show **Cancel booking**. Both dialogs require a reason of 1?500
trimmed characters, show the property-local scheduled check-in, and explicitly
state that no payment was collected. Confirmed cancellations show the applicable
percentage and next deadline from the permanent accepted terms. No host approval
is required. During-stay cancellation and monetary refunds remain out of scope.

Server enforcement and stored values:

- Only the authenticated booking owner can cancel. Recovery links/browser guest
  IDs do not authorize cancellation; an anonymous booking must first be claimed.
- Shared `canCancelBooking` and server time allow pending/confirmed bookings only
  strictly before `cancellationTerms.checkInAt`. Terminal statuses and repeated
  cancellation are rejected; concurrent attempts produce one committed outcome.
- `bookings.cancellation` records guest actor, authenticated `cancelledBy`, server
  `cancelledAt`, trimmed reason, `kind` (`withdrawal`/`cancellation`), and the
  accepted policy outcome (`null` for a pending withdrawal; 0/50/100 for a confirmed
  cancellation). Existing terms and booking history are preserved. This field is
  absent until cancellation; no invented legacy cancellation metadata is added.
- The server compares the reviewed status and percentage with the current outcome.
  If confirmation or a refund boundary changes the terms, submission is rejected.
  An open dialog refreshes every second and requires **Review updated terms**
  before its final confirmation becomes available again.
- Guest and host views show the recorded reason, time and policy outcome.
  Hidden/removed properties do not prevent cancellation.

Notification delivery:

- Guest confirmation and host notification scheduling commit with cancellation.
  Destinations come from booking/account data, never from request arguments.
  The scheduled destination/property name are preserved for retry; emails use
  escaped handwritten backend translations with English fallback.
- Each recipient has `pending`, `sent` or `failed` delivery state. `sent` means
  provider acceptance, not inbox delivery. Five attempts use delays of 1 minute,
  5 minutes, 30 minutes and 2 hours. Missing host accounts record a failed host
  notification without blocking guest cancellation. Exhausted delivery does not
  undo cancellation; operational monitoring is recorded in `TODOProduction.md`.
- [Resend documents idempotency keys](https://resend.com/changelog/idempotency-keys)
  retained for 24 hours. The stable booking/recipient key prevents duplicate
  sends during this retry window; this is not an indefinite delivery guarantee.

Verification: 13 new backend tests cover ownership, anonymous/unclaimed bookings,
required reasons, frozen policy, exact check-in/refund boundaries, stale status,
all three percentages, repeat/concurrent requests, removed properties, missing
hosts, escaped email content, successful retries and exhausted delivery. Browser
checks use the actual dialog/form with a mocked Convex transport: desktop and
390px mobile layouts, pending/confirmed wording, empty-reason rejection, trimmed
submission payloads and explicit review after a refund boundary changes.
All 127 tests across 30 files pass. The production build, Svelte autofixer checks, formatting and `bunx --bun oxlint` pass. Updated Convex functions deployed successfully to development. Real inbox delivery and authenticated navigation should be checked during review.

Files added:

- `src/shared/features/bookings/utils/canCancelBooking.ts`
- `src/convex/tables/bookings/mutations/cancelBooking.ts`
- `src/convex/tables/bookings/mutations/recordBookingCancellationNotification.ts`
- `src/convex/tables/bookings/queries/fetchBookingCancellationNotification.ts`
- `src/convex/tables/bookings/actions/deliverBookingCancellationEmail.ts`
- `src/convex/tables/bookings/emails/sendBookingCancellationEmail.ts`
- `src/convex/emails/translations/sendBookingCancellationEmailTranslation.ts`
- `src/features/bookings/components/booking-cancellation-dialog/booking-cancellation-dialog.svelte`
- `src/features/bookings/components/booking-cancellation-details/booking-cancellation-details.svelte`
- `tests/convex/guestCancellation.test.ts`

Files edited:

- `src/shared/features/bookings/schemas/bookingSchemas.ts`
- `src/shared/features/bookings/config.ts`
- `src/shared/features/bookings/types/bookingTypes.ts`
- `src/convex/tables/bookings/schema.ts`
- `src/convex/emails/types/emailTypes.ts`
- `src/convex/emails/sendEmail.ts`
- `src/shared/types/types.ts`
- `src/utils/getBackendErrorMessage.ts`
- `src/components/pages/(protected)/guest/my-bookings/my-booking-item.svelte`
- `src/components/pages/(protected)/host/bookings/host-bookings-details-dialog/host-bookings-details-dialog.svelte`
- `messages/en.json`
- `docs/ProjectCodingRules.md`
- `docs/TODOProduction.md`
- `docs/CancellationPolicySystemDesign.md`
- `src/convex/_generated/api.d.ts` (generated)

Stop here for user review. Chunk 6 (host cancellation and emergency support) has
not been started.

### Chunk 5 follow-up: account deletion restrictions

Self-service deletion, deletion verification links and admin removal all reject
accounts with pending or confirmed bookings, matching host ID, guest owner ID or
normalized email. This includes anonymous bookings and past checkout dates whose
status is still unresolved. Resolve requests/stays first; completed, declined and
cancelled history does not block deletion and remains stored afterwards.

Hosts must remove all owned accommodation listings before account deletion, so
no published listing is left without an owner. Indexed checks are shared between
an internal preflight query and the Better Auth user deletion trigger. The trigger
runs in the component deletion transaction and rolls back deletion if a concurrent
booking/listing changes eligibility. Preflight runs before sending verification
emails or admin session revocation; `beforeDelete` rechecks before actual deletion.
Errors are shown with translated messages in the existing auth action flow.

The missing-host branch in guest cancellation remains protection for historical
orphaned data; supported account deletion now prevents new unresolved orphans.

Added: `src/convex/betterAuth/helpers/checkAccountDeletionRestrictions.ts`,
`src/convex/betterAuth/queries/checkAccountDeletion.ts`,
`tests/convex/accountDeletion.test.ts`.

Edited: `src/convex/betterAuth/config.ts`,
`src/convex/tables/bookings/schema.ts`, `src/shared/types/types.ts`,
`src/utils/getBackendErrorMessage.ts`, `src/features/auth/lib/runAuthAction.ts`,
`messages/en.json`, `tests/convex/guestCancellation.test.ts`,
`src/convex/_generated/api.d.ts`, `docs/ProjectCodingRules.md`,
`docs/CancellationPolicySystemDesign.md`.

Follow-up verification: all 142 tests across 31 files pass, including 15 account
deletion tests and 13 Chunk 5 cancellation tests. Account deletion tests exercise
actual Better Auth HTTP routes with signed session cookies, blocked verification
requests, old verification callbacks, admin rejection before session revocation,
transactional rollback and successful verified deletion after resolving bookings.
The production build, Svelte/TypeScript checks (zero errors/warnings), and Oxlint
pass. The extracted cancellation dialog was checked again in headless Edge at
desktop and 390px mobile sizes: no horizontal overflow, empty reasons rejected,
pending withdrawal/confirmed cancellation payloads correct, and submission blocked
until changed refund terms are reviewed. Browser checks use a mocked Convex
transport; real inbox delivery and the full signed-in navigation remain unverified.
The deletion functions and indexes were synced to the development deployment.

### Booking request receipt emails

Booking creation previously sent no notification. New requests now schedule
separate guest and host emails in the booking creation transaction. The guest
receipt explicitly says a request requires host acceptance; it does not claim
that the stay is confirmed. The host notice includes the guest/stay details,
special requests, a host bookings review link and the guest email as Reply-To.
Both display the frozen check-in/check-out instants in property local time,
including date-specific offsets, and state that no payment was collected.

Guest status links use the existing public, non-identifying confirmation page;
anonymous guests also receive instructions and a recovery link for further
booking access. Delivery does not create a recovery token or grant ownership.

`bookings.requestNotifications` records pending/sent/failed per recipient.
It is absent on historical bookings, which are not emailed retroactively.
Internal delivery uses shared email retry delays and stable booking/recipient
idempotency keys. The property name is captured when the request is submitted,
and the resolved recipient address is preserved across retries. Provider failures
never undo booking creation; failed delivery monitoring is in TODOProduction.
Host confirmation/status-change emails remain separate work.

Added files:

- `src/convex/tables/bookings/actions/deliverBookingRequestEmail.ts`
- `src/convex/tables/bookings/emails/sendBookingRequestEmail.ts`
- `src/convex/tables/bookings/mutations/recordBookingRequestNotification.ts`
- `src/convex/emails/translations/sendBookingRequestEmailTranslation.ts`
- `tests/convex/bookingRequestEmails.test.ts`

Edited files:

- `src/convex/tables/bookings/mutations/createBooking.ts`
- `src/convex/tables/bookings/schema.ts`
- `src/convex/tables/bookings/actions/deliverBookingCancellationEmail.ts`
- `src/convex/emails/types/emailTypes.ts`
- `src/shared/features/bookings/config.ts`
- `src/convex/_generated/api.d.ts`
- `docs/ProjectCodingRules.md`
- `docs/TODOProduction.md`
- `docs/CancellationPolicySystemDesign.md`

Verification: all 150 tests across 32 files pass, including eight new request-email
integration tests covering anonymous/signed-in requests, guest/host destinations,
pending wording, frozen property-local times, HTML escaping, forged/invalid
requests, retry payload/key stability, duplicate suppression and recipient-specific
or configuration failures. Svelte/TypeScript checks report zero errors/warnings;
Oxlint and targeted formatting pass. Functions were deployed to development.
Tests mock the mail provider; actual inbox delivery remains a production check.

Booking request email simplification: `createBooking` passes the required booking
snapshot directly to the scheduled `deliverBookingRequestEmail` action. The
separate `fetchBookingRequestNotification` query has been removed. The existing
`recordBookingRequestNotification` mutation returns delivery eligibility for a
pending call without writing, and records sent/failed outcomes afterwards. This
keeps duplicate suppression and deleted-booking handling while avoiding another
query/file and keeps receipt content stable across retries and later edits.

## Resend component integration (supersedes custom retry notes above)

The application previously called the Resend API directly. The official
`@convex-dev/resend` component now owns email batching, durable sending, rate
limiting, exponential retries and enqueue idempotency for every existing email
flow: booking requests, cancellations, booking recovery, authentication OTPs,
account deletion verification and contact messages. Existing templates and
translations are retained. See the [official component documentation](https://github.com/get-convex/resend).

Booking creation directly enqueues both request receipts and stores their component
IDs in the same transaction as the pending booking; an enqueue failure rolls back
creation. Cancellation mutations retain scheduled internal enqueue mutations.
Returned component IDs are stored transactionally as `bookings.requestEmailIds.guest/host` or
`bookings.cancellation.emailIds.guest/host`. The component owns delivery status;
there are no application attempt counters, retry delays, notification-state
mutations or delivery queries. The component may batch multiple recipients in
one provider request: an API failure retries that batch with its unchanged key,
while previously successful batches are not resent. A successful API response
means `sent`; signed provider webhooks establish `delivered` or `bounced`.

The development webhook is registered at
`https://grateful-otter-919.eu-west-1.convex.site/resend-webhook`, with outgoing
email events enabled and its signing secret stored in Convex as
`RESEND_WEBHOOK_SECRET`. Existing `RESEND_API_KEY` and `EMAIL_FROM` are reused.
Production configuration and retention/monitoring remain in `TODOProduction.md`.

The development migration `removeBookingEmailRetryState` completed across 393
bookings before schema tightening. It removes obsolete operational status fields
without changing booking/cancellation history or sending historical receipts.
Older provider deliveries do not acquire fabricated component IDs. Run this
migration against existing production data under the temporarily widened schema
before removing old fields there; development is already fully migrated.

Validation: 149 automated tests across 32 files pass; TypeScript/Svelte reports
zero errors/warnings and Oxlint passes. A live send to Resend's automated test
inbox reached `delivered`, verifying the registered component and signed webhook.

Files added:

- `src/convex/tables/bookings/mutations/enqueueBookingRequestEmail.ts`
- `src/convex/tables/bookings/mutations/enqueueBookingCancellationEmail.ts`
- `src/convex/migrations/removeBookingEmailRetryState.ts`
- `tests/fixtures/resend.ts`

Files edited:

- `package.json`
- `bun.lock`
- `src/convex/convex.config.ts`
- `src/convex/http.ts`
- `src/convex/emails/sendEmail.ts`
- `src/convex/betterAuth/config.ts`
- `src/convex/betterAuth/helpers/sendOtpEmail.ts`
- `src/convex/betterAuth/emails/sendVerificationOTPEmail.ts`
- `src/convex/betterAuth/emails/sendDeleteAccountVerificationEmail.ts`
- `src/convex/contact/mutations/sendContactForm.ts`
- `src/convex/tables/bookingRecoveryTokens/emails/sendBookingRecoveryEmail.ts`
- `src/convex/tables/bookingRecoveryTokens/actions/deliverBookingRecoveryLink.ts`
- `src/convex/tables/bookings/schema.ts`
- `src/convex/tables/bookings/mutations/createBooking.ts`
- `src/convex/tables/bookings/mutations/cancelBooking.ts`
- `src/convex/tables/bookings/emails/sendBookingRequestEmail.ts`
- `src/convex/tables/bookings/emails/sendBookingCancellationEmail.ts`
- `src/shared/features/bookings/config.ts`
- `tests/convex/bookingRequestEmails.test.ts`
- `tests/convex/guestCancellation.test.ts`
- `tests/convex/bookingRecovery.test.ts`
- `docs/ProjectCodingRules.md`
- `docs/TODOProduction.md`
- `docs/CancellationPolicySystemDesign.md`
- `src/convex/_generated/api.d.ts` (generated)

Files removed:

- `src/convex/tables/bookings/actions/deliverBookingRequestEmail.ts`
- `src/convex/tables/bookings/actions/deliverBookingCancellationEmail.ts`
- `src/convex/tables/bookings/mutations/recordBookingRequestNotification.ts`
- `src/convex/tables/bookings/mutations/recordBookingCancellationNotification.ts`
- `src/convex/tables/bookings/queries/fetchBookingCancellationNotification.ts`

## Unanswered request expiration

A pending request has a 24 elapsed-hour response window, capped by its frozen
scheduled check-in instant. New requests persist `requestExpiresAt` during creation.
The five-minute `expireBookingRequestsCron` processes indexed batches of 25 pending
requests, atomically setting terminal `expired`, `expiredAt` (processing time) and
`expirationEmailId` while enqueueing a guest-only expiration notice through Resend.
Expiration is not a cancellation: it creates no cancellation actor, charge or refund
outcome. Confirmed stays and terminal history remain untouched. Guest ownership,
claimability, frozen terms and booking totals remain intact.

Existing pending records without a deadline are initialized in bounded batches
using `_creationTime + 24 hours`, capped by frozen `checkInAt`. Overdue existing
requests expire and receive notices. Full batches schedule continuation calls; the
cron never scans the whole booking table. Host pending actions and guest withdrawal
reject at the exact deadline, independently of cron timing. Expired requests cannot
be reopened, but a guest may submit a new request subject to current availability.

Status and email enqueue share a transaction. An enqueue failure rolls back that
batch; a subsequent cron can retry. Provider delivery failures are retried by the
Resend component with stable `booking-expiration/<bookingId>/guest` keys. Missing
listings do not prevent expiration. Notifications use frozen property-local stay
times and safe public status/recovery links; no recovery credential is emailed by
this flow. Guest and host views label this outcome "Request expired". Only pending
or confirmed records block account deletion, so expiration releases that restriction.

The 24-hour window follows [Airbnb request expiry](https://www.airbnb.com/help/article/28)
and [Vrbo 24-hour review](https://help.vrbo.com/articles/How-do-I-accept-a-booking-request).
The earlier check-in cutoff and five-minute processing interval are project choices.
Production rollout also initializes and notifies existing overdue pending requests;
verify recipient data and monitor cron failures and component delivery status.
