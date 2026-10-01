# Find a booking system design

## Purpose

`/find-booking` helps guests recover bookings through the email address they
used when booking, particularly when they booked without signing in. Reading
a recovered booking does not require an account. Adding a booking to an
account is a separate, explicit action after verification and sign-in.

This document describes the current approved behavior. Chunks 1/2 provide
normalized lookup, hashed tokens and recovery email delivery. The form and
automatic reusable-token lookup are connected: opening `/find-booking?token=...`
loads a bounded booking page without another confirmation button. Links remain
usable until their original 15-minute expiry. Booking-detail dialogs and explicit
account claiming are implemented. Date tabs remain a deferred review step.
Bookings already store contact email, stay dates, status and optional account
ownership. `fetchBookingConfirmation` currently returns limited stay details
using the booking ID; it does not verify email ownership or grant recovery or
claiming permissions.

## Page design and copy

Use one narrow, centered form with generous mobile spacing and visible labels.
Keep the page focused on recovery, with no promotional panels or extra fields.

- Title: **Find your booking**.
- Description: **Enter the email address you used when booking. We'll send you
  a secure link.**
- One labelled **Email address** field with email autocomplete.
- Primary button: **Send booking link**.
- Secondary links: **My bookings** and **Contact support**.

Signed-in guests can go directly to My bookings for reservations already
attached to their account. Recovery remains available for a different booking
email or an anonymous booking. Signed-out guests can use the recovery form
without registering; My bookings uses the existing authentication flow.

The primary action shows a pending state and prevents duplicate submissions.
An invalid email gets an inline error linked to its field. Keyboard focus,
screen-reader announcements and error handling follow the existing form
patterns. All visible copy belongs in translation keys.

## Exact guest flow

1. The guest enters their booking email and submits the form.
2. The server validates and normalizes the email. Valid submissions receive
   the same public response regardless of matching bookings or silently
   suppressed sends: **If we find bookings for this email, we'll send you a
   secure link.** The response must not reveal booking counts or existence.
3. The confirmation state reminds the guest to check their inbox and spam
   folder. It offers **Use a different email** and **Send a new link**, with a
   resend cooldown. Returning to the form preserves the entered address.
4. When matching bookings exist and sending is permitted, the guest receives
   an email containing a secure recovery link. The email makes clear that it
   grants access to booking information and should not be shared.
5. Opening the link automatically verifies the token and loads matching bookings.
   There is no exchange, consumption, recovery cookie or separate confirmation.
   Refreshing, reopening and pagination reuse the same token until expiry.
6. After verification, the guest sees matching bookings, with upcoming and
   ongoing stays first and a separate Past bookings view. Each item shows the
   property, stay dates, guest count and current booking status. Results are
   paginated; the application does not fetch the whole booking history.
7. Selecting a booking opens its details in a `NativeDialog`, using native
   command buttons. Show the complete stay information and only actions that
   the current backend actually supports. Recovery itself is read-only.
8. An unclaimed booking offers **Add to my account** separately. The guest
   signs in or creates an account and explicitly confirms the claim. Recovery
   alone never changes ownership or signs someone into an account.

Cancelled, declined and completed bookings remain readable. Every returned
booking requires an accommodation name. A missing accommodation relationship
raises the existing `ACCOMMODATION_NOT_FOUND` error; the page handles failed reads
through its existing error state.

## Status and failure states

| State                                    | Behavior                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| Pending booking                          | Show **Awaiting host confirmation**; never describe it as confirmed.              |
| Confirmed booking                        | Show the existing confirmed status and stay information.                          |
| Completed, declined or cancelled         | Show the actual status and appropriate existing explanation.                      |
| Invalid email                            | Show an inline validation error and preserve input.                               |
| Network or general service failure       | Offer retry; preserve input and disclose no booking existence.                    |
| No matching bookings before verification | Use the same generic email-submission confirmation.                               |
| Invalid or expired link                  | Show **This link is no longer valid** and **Send a new link**.                    |
| Expired recovery token                   | Stop returning booking data and offer a fresh recovery link.                      |
| No results after verification            | Show a quiet empty state with support and recovery actions.                       |
| Email address entered incorrectly        | Let the guest correct it; support handles loss of access to the original mailbox. |

A request acknowledgement means the form was processed, not that an email was
delivered or that a booking is confirmed. Do not invent cancellation, payment,
refund or guest editing capabilities that the current app does not provide.

## Access and backend rules

- Reuse the existing Convex email sender, rate limiter, builders, schemas and
  UI components. Do not add another email provider or authentication system.
- Normalize email consistently for new bookings and recovery lookup. Backfill
  existing records and use an index; never scan the bookings table by email.
  Do not apply provider-specific rewriting such as removing dots or plus tags.
- Issue cryptographically random recovery tokens. Store only their SHA-256
  hashes, normalized email scope and expiry. The configured lifetime is
  **15 minutes**. Reads never consume the token or extend its lifetime.
- Every list and detail request checks the token and exact email scope on the
  server. The frontend sends the raw token, never an email or trusted timestamp.
  A public query hashes it and checks server time during its execution before an
  indexed booking read. `cleanupExpiredBookingRecoveryTokensCron` deletes expired
  credentials through `by_expires_at` every minute, invalidating subscribed queries.
  Cached results can remain visible until cleanup runs, including scheduler delay;
  this cron approach does not guarantee invalidation at the exact expiry millisecond.
- The token stays in the link so it can be reopened until expiry. The page uses
  `noindex` and `no-referrer`, keeps tokens out of logs/analytics and clears
  displayed results when the live query reports invalid access. Invalid links offer a new-link form.
  No recovery sessions or cookies are created. Historical consumed credentials
  stay rejected; compatibility schema fields/tables remain for existing data.
- Return only guest-facing fields; keep account IDs, host IDs and support or
  moderation metadata private. A booking ID cannot bypass email verification.
- Rate-limit email requests using the existing machinery.
  Use both destination-based and broader abuse limits; a browser-provided ID
  is not a trusted identity. Keep request responses and processing timing
  consistent for matching and nonmatching email addresses. Never expose
  recipient-specific delivery failures in the public form.
- Recovering an account-owned booking allows the verified booking-email holder
  to read the guest-facing receipt; it does not transfer account ownership.
- Claiming requires a valid recovery grant, a signed-in account with the same
  verified email and an unowned booking. Derive the account ID server-side.
  Reject conflicting ownership and make repeat claims by the existing owner
  idempotent. Update the existing owner aggregate in the same transaction.
- Reading a booking never changes its lifecycle, eligibility for reviews or
  ownership. Claiming does not mark a stay completed.

## Project placement

The `/find-booking` route owns page composition and server access. Its page
pieces belong under `src/components/pages/(unprotected)/find-booking`, with
header, keyed booking-item and loading components named after their roles.
The details dialog belongs alongside these page pieces. Use existing
`DataList`, `NativeDialog`, form, status and date utilities.

Put shared recovery configuration, validation and types in the owning shared
booking feature. Keep secrets, token verification and email sending on the
server. Existing frontend callers pass `getLocale()` to shared formatting
utilities; shared modules must not import Paraglide into Convex bundles.

Use translations under `FindBookingPage` and component-specific namespaces.
The claim page gets its own namespace. Add email copy to the established email
template/translation structure. Decide any necessary recovery server endpoint
names while implementing the relevant chunk, following the existing route and
Convex conventions.

## Implementation chunks and review checkpoints

Implement **one chunk per approved step**. At the end of each chunk, report
what changed, validation results and how to review it, then stop. Do not begin
the next chunk until the user reviews it and explicitly asks to continue.
If a chunk needs a correction, finish that correction within the same chunk.
These are local review milestones, not permission to deploy incomplete flows.

### Chunk 1 — Recovery data and access contracts

Historical checkpoint: the single-use/session parts below were superseded by
the approved reusable-token flow documented in the current Chunk 3 step.

Add the minimum normalized-email lookup/index, recovery-token storage and
temporary-session storage. Define expiry configuration, validators and narrow
guest-facing return types. Backfill existing booking email lookup values
without changing ownership or lifecycle. Implement internal token/session
operations, including atomic consumption and expiry checks; do not expose an
unprotected booking lookup while building the feature.

Validate email lookup consistency, token hashing, expiry, single-use behavior
and concurrent consumption with focused backend tests. Read Convex's project
guidelines before modifying backend code.

**Review checkpoint:** inspect the schema changes, migration/backfill plan,
access contracts and test results. Stop before adding email delivery.

#### Chunk 1 implementation and backfill review

New bookings and recovery requests use `bookingEmailSchema`: trim whitespace,
lowercase, validate, and preserve dots/plus tags. The existing booking `email`
field is the lookup value; no redundant email column is added. The compound
`by_email_check_out_date` index supports exact email lookup and later date
pagination. The `Booking` contract excludes ownership, host,
review and completion/moderation metadata.

All recovery functions are internal. Actions generate 32 random bytes with
Web Crypto and hash secrets using SHA-256 before database calls. Token
consumption and session insertion happen in one mutation. Expired or consumed
tokens fail, and session checks use trusted server time with a strict expiry
boundary. Sessions can be revoked without touching a booking or account.
Raw tokens and session secrets are returned only to internal callers that
will later deliver the email or set the cookie; never log or return those
results from a public recovery-request endpoint. Expired records remain
inaccessible; retention cleanup is deferred until delivery is implemented.

The backfill is implemented and tested locally, including dry-run rollback,
bounded resumption and idempotence. It has **not** been run on deployment data.
After deployment is separately approved, preview and then start/resume it:

```powershell
bunx convex run migrations/backfillBookingEmails:backfillBookingEmails '{"dryRun":true,"batchSize":100}'
bunx convex run migrations/backfillBookingEmails:backfillBookingEmails '{"batchSize":100}'
```

The existing migration component tracks progress and schedules bounded batches.
Preview only examines one batch; verify migration completion before enabling
email recovery. A malformed historical email is normalized without inventing
an address; new requests still require a valid email.

Focused checks:

```powershell
bun run test:convex -- tests/convex/bookingRecovery.test.ts tests/convex/bookings.test.ts
bun run check
bunx --bun oxlint
```

Review the two recovery table schemas and their individual callable files under
`tables/bookingRecoveryTokens` and
`tables/bookingRecoverySessions`, plus `migrations/backfillBookingEmails.ts`.
Lifetimes live in `src/shared/features/bookings/config.ts`. The credential-format
schema lives in `src/shared/features/bookingsRecoveryTokens/schemas/bookingRecoveryTokenSchemas.ts`
and is reused for session secrets. `src/shared/utils/secrets.ts` provides secure
secret generation and hashing; its hexadecimal encoder stays private.
Chunk 2 will reuse the configured Resend sender; Chunk 1 sends no emails.

### Chunk 2 — Request and deliver a recovery link

Implement the public recovery-request action with validation, consistent
responses, abuse limits and the existing email sender. Create the recovery
email with its explicit access warning and expiry explanation. Only matching,
permitted requests send email. Verify delivery failure handling and keep
secrets out of observable responses and logs.

Test matching/nonmatching responses, rate limits, expiry metadata and email
content with the project's existing testing approach. Sending a live test
email requires an explicitly designated recipient; otherwise use the existing
test delivery mechanism.

**Review checkpoint:** inspect the email preview, public response and abuse
handling. Stop before connecting the page.

#### Chunk 2 implementation and review

The public `requestBookingRecoveryLink` action accepts `{ email, locale }`;
frontend callers pass `locale: getLocale()`. It validates and normalizes input
with its shared operation schema and forwards the locale to queued delivery.
Malformed email or locale receives the structured
`INVALID_BOOKING_RECOVERY_REQUEST` error, translated by the existing backend
error map. Every valid request returns `null`, including silently throttled
requests. The UI acknowledgement key is `FindBookingPage.requestAcknowledged`;
an acknowledgement never promises email delivery.

The action performs no booking lookup or provider call. Allowed requests queue
the same internal `deliverBookingRecoveryLink` action for matching and
nonmatching email addresses, with a minimum public handler duration of 500 ms.
The delivery action issues a token only when the indexed lookup matches and
sends through the existing Convex Resend wrapper. Token expiry starts at
issuance during delivery, rather than while a request waits in the queue.
Delivery errors log only a fixed message, with no provider diagnostic, address,
token or recovery URL. They cannot change the public request's response.

Abuse controls reuse the existing `action` builder (which accepts `rateLimit`
options just like the mutation builder) and rate-limiter component:

The destination cooldown/hourly functions live in
`src/convex/tables/bookingRecoveryTokens/ratelimiting/bookingRecoveryTokenRateLimits.ts`
and are imported by the request action.
Bucket names and settings are defined in
`src/convex/rateLimits/bookingRecoveryRateLimits.ts`; the action and destination
helpers import their policies from that file.

- Global token bucket: 60 requests/minute, initial burst capacity 20.
- Normalized-email cooldown: one request/minute, capacity one.
- Normalized-email hourly bucket: five requests/hour, capacity five.
- Destination keys are SHA-256 hashes of the normalized email. Limits apply to
  nonmatching addresses too; browser-supplied actor IDs are not accepted.

The email selects handwritten copy from
`src/convex/emails/translations/sendBookingRecoveryEmailTranslation.ts` using
the caller's locale through `src/convex/utils/getTranslationLocale.ts`, falling
back to English until other translations exist. Translation files contain only
the locale dictionaries; selection and fallback live in the utility.
Each locale defines `subject`, `heading` and one `body` object containing the
complete `text` and `html` message templates. Body sentences are translated
together, with the recovery URL and lifetime supplied by the email helper.
Convex imports no Paraglide code. Frontend acknowledgement and validation copy
remain in `messages/en.json`; the unused `BookingRecoveryEmail` keys are removed.
The email includes HTML and
plain text, the access/sharing warning, configured 15-minute lifetime,
reusable-until-expiry explanation, automatic-loading notice and an
ignore notice. The link uses `/find-booking?token=...` on the existing trusted
`PUBLIC_ORIGIN`/email-brand origin; no caller-supplied URL is accepted.
Automatic link verification is implemented in the current Chunk 3 review step. Before enabling the complete
flow, complete the Chunk 1 backfill and confirm the deployment's configured
origin points to the app and its existing Resend settings are available.

Review [the generated email preview](./previews/BookingRecoveryEmail.html).
Its example link contains an invalid preview token. No live email was sent:
tests and preview generation replace Resend HTTP calls with mocks. Tests cover
matching/nonmatching acknowledgements, normalized destination limits, broader
anonymous throttling, token expiry metadata, email content, and provider/network
failure privacy, alongside the Chunk 1 access tests.

Stop here for review before building or connecting the recovery page.

### Chunk 3 — Build the recovery form and verify access

Implement the `/find-booking` form with the shared `Form`, then automatically
validate the emailed token and show a bounded read-only booking page. The
shared header stays visible. Invalid/expired links offer a new-link form;
network failures offer retry. No separate confirmation, exchange or cookies.

Validate input retention, reusable/concurrent reads, email scope, exact expiry,
pagination and unavailable listings. Run Svelte autofixer for changed Svelte
files, `bun run check` and `bunx --bun oxlint`.

**Review checkpoint:** review the full email-to-verified-access journey.
Stop before adding booking results.

#### Chunk 3, first review step: email request form

This review step implements only the email request form. The route composes
`FindBookingHeader` (static title/description, no state or props) and
`FindBookingForm`. The latter uses the existing shared `Form` with one email
field, `requestBookingRecoveryLinkSchema`, `locale: getLocale()` and the existing
public `requestBookingRecoveryLink` action. Convex email delivery uses an action,
since mutations cannot send external email. Shared Form owns validation,
pending state, errors and the generic success acknowledgement; input is retained.

There are no native page POST forms, route server actions, confirmation states,
resend countdowns, verification bridges or recovery cookies in this step.
The earlier attempt at those pieces has been removed for this review.
Chunks 1/2 remain intact. Email delivery still requires matching bookings and
permitted requests; successful submission does not promise delivery or reveal
booking existence. No live email is sent during automated checks.

Files created for this step:

- `src/components/pages/(unprotected)/find-booking/find-booking-header.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-form.svelte`

Files edited for this step:

- `src/routes/(app)/(unprotected)/find-booking/+page.svelte`
- `messages/en.json`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

Verification-only files, configuration, policy additions, generated declarations
and tests from the broader attempt were removed/restored. The remaining internal
token/session operations are the previously reviewed Chunk 1 foundation.

Removed from the broader attempt:

- `src/routes/(app)/(unprotected)/find-booking/+page.server.ts`
- `src/features/bookings/server/bookingRecovery.server.ts`
- `src/convex/tables/bookingRecoveryTokens/httpActions/exchangeBookingRecoveryLink.ts`
- `src/convex/tables/bookingRecoverySessions/httpActions/validateBookingRecoveryAccess.ts`
- `src/convex/utils/isBookingRecoveryServerRequest.ts`
- `tests/bookingRecoveryPage.test.ts`
- `tests/helpers/serverEnv.ts`

Restored by removing only additions from that attempt:

- `src/hooks.server.ts`
- `src/convex/http.ts`
- `src/convex/convex.config.ts`
- `src/shared/features/bookings/config.ts`
- `src/convex/rateLimits/bookingRecoveryRateLimits.ts`
- `src/convex/tables/bookingRecoveryTokens/ratelimiting/bookingRecoveryTokenRateLimits.ts`
- `tests/convex/bookingRecovery.test.ts`
- `vitest.config.ts`
- `.convex.example.env`
- `src/convex/_generated/api.d.ts` (regenerated)
- `src/convex/_generated/server.d.ts` (regenerated)

Validation: 14 focused recovery/booking tests pass; Svelte check has zero errors
or warnings; Svelte autofixer and `bunx --bun oxlint` pass. Browser checks confirm
one email field, mobile/desktop layout, keyboard access and retained invalid
input through shared Form validation. No live email was sent.

**Stop for review here.** The next small step is deciding and implementing what
opening the emailed link should do. At the time of that first step, verification and temporary
access and booking results were not implemented.

#### Chunk 3, historical action step: automatic reusable-token access

This historical step superseded Chunk 1's single-use/session design. Its action-based lookup was subsequently replaced by the query/cron step below.
`FindBookingDetails` automatically calls the public read-only
`fetchBookingRecoveryBookings` action. Its internal query validates the hashed
token, checks server-supplied time and paginates `by_email_check_out_date`.
Pages return at most 20 rows (the UI requests 10), with bounded read budgets.
The browser retains one result page and cursor history, not a token-keyed cache.
Results are ordered by checkout date descending and include every booking status.
The current cards show property, dates, guest count and actual status, retaining
rows whose accommodation is missing. Detail dialogs and date tabs are deferred.

The page remounts details when the URL token changes. Loading has its own page
component; transient errors offer retry. Invalid or expired links offer
**Request a new link**, which removes the token parameter and shows the existing
email form. A server-relative expiry timer clears displayed data; returning to a
backgrounded tab checks expiry again. Browser time is never an authorization input.

Obsolete exchange, consumption and session callables and the one-hour session
configuration are removed. Existing table schemas remain compatible with stored
data; new reads never create sessions or write consumption metadata. Email copy
and the preview now explain reuse until expiry and automatic loading. Paraglide
stays frontend-only. Recovery never signs in, claims or changes a booking.

Review: request a link, open it directly, refresh/reopen it before expiry, navigate
pages, then check invalid/expired-link UI. Focused backend tests verify repeated
and concurrent reads, scope, pagination, missing listings, strict expiry, hashing
and unchanged bookings, alongside the existing request/email tests.

Files created in the current reusable-token step:

- `src/convex/tables/bookingRecoveryTokens/actions/fetchBookingRecoveryBookings.ts`
- `src/convex/tables/bookingRecoveryTokens/queries/fetchBookingRecoveryBookings.ts`
- `src/convex/tables/bookingRecoveryTokens/validators/bookingRecoveryTokenValidators.ts`
- `src/components/pages/(unprotected)/find-booking/find-booking-details-item.svelte`
- `src/components/pages/(unprotected)/find-booking/loading/find-booking-details-loading.svelte`

Files edited in this step:

- `src/components/pages/(unprotected)/find-booking/find-booking-details.svelte`
- `src/routes/(app)/(unprotected)/find-booking/+page.svelte`
- `src/shared/features/bookings/config.ts`
- `src/shared/features/bookings/types/bookingTypes.ts`
- `src/convex/tables/bookingRecoveryTokens/actions/issueBookingRecoveryToken.ts`
- `src/convex/tables/bookingRecoveryTokens/mutations/storeBookingRecoveryToken.ts`
- `src/convex/tables/bookingRecoveryTokens/schema.ts`
- `src/convex/tables/bookings/validators/bookingValidators.ts`
- `src/convex/emails/translations/sendBookingRecoveryEmailTranslation.ts`
- `src/convex/_generated/api.d.ts` (regenerated)
- `messages/en.json`
- `tests/convex/bookingRecovery.test.ts`
- `docs/previews/BookingRecoveryEmail.html`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

Files removed in this step:

- `src/convex/tables/bookingRecoveryTokens/actions/exchangeBookingRecoveryToken.ts`
- `src/convex/tables/bookingRecoveryTokens/mutations/consumeBookingRecoveryToken.ts`
- `src/convex/tables/bookingRecoverySessions/actions/endBookingRecoverySession.ts`
- `src/convex/tables/bookingRecoverySessions/actions/validateBookingRecoverySession.ts`
- `src/convex/tables/bookingRecoverySessions/mutations/revokeBookingRecoverySession.ts`
- `src/convex/tables/bookingRecoverySessions/queries/fetchBookingRecoverySession.ts`
- `src/convex/tables/bookingRecoverySessions/validators/bookingRecoverySessionValidators.ts`

Validation: 13 focused recovery/booking tests pass; Svelte check reports zero
errors or warnings; Svelte autofixer and `bunx --bun oxlint` pass. No live email
was sent during verification. Stop for review before adding detail dialogs,
date tabs or account claiming.

#### Chunk 3, current review step: query pagination and token expiry cron

The lookup is now a public `fetchBookingRecoveryBookings` query under the token
table's `queries` folder. It validates and hashes the raw token, verifies its
email scope, rejects consumed credentials and checks expiry when it executes.
It returns the existing bounded guest-facing page or `null` for invalid access.
No caller-supplied email or clock participates in authorization.

`FindBookingDetails` uses the existing `useConvexPagination` hook. The manual
action loader, cursor object, disposed state and frontend expiry timer are
removed. Loading/error/invalid-access branches inspect the live query result
before rendering `DataList`, so a cached page cannot bypass an invalid result.
The shared pagination types now infer items from nullable query results, and
the query builder normalizes `null` to an absent fresh page.

`cleanupExpiredBookingRecoveryTokensCron` is an internal mutation under
`tables/bookingRecoveryTokens/crons`, with `Cron` in both file and function names.
Root `src/convex/crons.ts` registers it every minute. It uses `by_expires_at`,
deletes at most 100 rows and schedules another bounded batch when full, matching
the project's existing cleanup pattern. Configuration lives in shared bookings
`config.ts`. Deletion invalidates subscriptions reading that token. Valid tokens
and bookings remain untouched, and cleanup is idempotent.

Timing: a fresh execution checks the token's configured 15-minute expiry, but
existing cached subscriptions invalidate when cleanup deletes the row. They may
retain results until the next one-minute run, plus scheduler/backlog delay.
This is the approved cron-based approach rather than an exact frontend timer.

Created:

- `src/convex/tables/bookingRecoveryTokens/crons/cleanupExpiredBookingRecoveryTokensCron.ts`

Edited:

- `src/convex/crons.ts`
- `src/convex/tables/bookingRecoveryTokens/queries/fetchBookingRecoveryBookings.ts`
- `src/convex/tables/bookingRecoveryTokens/schema.ts`
- `src/convex/tables/bookingRecoveryTokens/validators/bookingRecoveryTokenValidators.ts`
- `src/shared/features/bookings/config.ts`
- `src/shared/features/bookings/types/bookingTypes.ts`
- `src/components/pages/(unprotected)/find-booking/find-booking-details.svelte`
- `src/features/pagination/types/convexPaginationTypes.ts`
- `src/features/pagination/builders/createConvexPaginationQuery.svelte.ts`
- `src/convex/_generated/api.d.ts` (regenerated)
- `tests/convex/bookingRecovery.test.ts`
- `docs/FindABookingSystemDesign.md`
- `docs/ProjectCodingRules.md`

Removed:

- `src/convex/tables/bookingRecoveryTokens/actions/fetchBookingRecoveryBookings.ts`

Validation: 14 focused recovery/booking tests pass, covering query reuse, email
scope, pagination, execution-time expiry and bounded cron continuation while
preserving valid tokens and bookings. Svelte check has zero errors/warnings;
autofixer and `bunx --bun oxlint` pass. No live email was sent.
Stop for review before adding booking-detail dialogs, date tabs or claiming.

#### Chunk 3, config and query ownership correction

Shared bookings settings are consolidated into one `BOOKINGS_CONFIG` object.
Token lifetime, cleanup interval/batch size, request delay and destination limits
are its `RECOVERY_*` properties. All consumers import that object, including
email rendering, token storage, cron registration/cleanup, rate policies and tests.

The lookup now lives at `tables/bookings/queries/fetchBooking.ts`. Its optional
`token` selects recovery scope when supplied, including invalid/empty tokens;
without a token it requires authenticated identity and reads only owned bookings
through `by_owner_id`. Invalid supplied tokens return `null` without falling back
to account access. Both paths retain the bounded guest-facing result contract.
The page validator belongs in `bookings/validators/bookingValidators.ts`.
The former token-table query is removed, and generated references/callers are updated.

`FindBookingDetails` imports `PAGINATION_CONFIG.DEFAULT_PAGE_SIZE` for its existing
pagination hook. Tests also use that default for ordinary page requests; explicit
small/oversized values remain only in pagination boundary checks.

Created:

- `src/convex/tables/bookings/queries/fetchBooking.ts`

Edited:

- `src/shared/features/bookings/config.ts`
- `src/convex/crons.ts`
- `src/convex/rateLimits/bookingRecoveryRateLimits.ts`
- `src/convex/tables/bookingRecoveryTokens/mutations/storeBookingRecoveryToken.ts`
- `src/convex/tables/bookingRecoveryTokens/emails/sendBookingRecoveryEmail.ts`
- `src/convex/tables/bookingRecoveryTokens/crons/cleanupExpiredBookingRecoveryTokensCron.ts`
- `src/convex/tables/bookingRecoveryTokens/actions/requestBookingRecoveryLink.ts`
- `src/convex/tables/bookingRecoveryTokens/validators/bookingRecoveryTokenValidators.ts`
- `src/convex/tables/bookings/validators/bookingValidators.ts`
- `src/components/pages/(unprotected)/find-booking/find-booking-details.svelte`
- `src/convex/_generated/api.d.ts` (regenerated)
- `tests/convex/bookingRecovery.test.ts`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

Removed:

- `src/convex/tables/bookingRecoveryTokens/queries/fetchBookingRecoveryBookings.ts`

#### Chunk 3, booking item reuse correction

`FindBookingDetailsItem` renders the required accommodation name directly and
uses the existing `BookingStatusBadge`. The six obsolete item translation keys
(`unavailable` and the five statuses) are removed; status labels come from the
shared bookings feature. The guest-booking type and validator require a string
name, and `fetchBooking` raises the existing `ACCOMMODATION_NOT_FOUND` error if
the related accommodation is missing. This supersedes the earlier nullable-name
card behavior.

Edited:

- `src/components/pages/(unprotected)/find-booking/find-booking-details-item.svelte`
- `messages/en.json`
- `src/shared/features/bookings/types/bookingTypes.ts`
- `src/convex/tables/bookings/validators/bookingValidators.ts`
- `src/convex/tables/bookings/queries/fetchBooking.ts`
- `tests/convex/bookingRecovery.test.ts`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

No files were created or deleted. The existing focused check verifies both the
required name and the missing-accommodation error.

#### Chunk 3, visible request acknowledgement

`FindBookingForm` keeps the existing success toast and also displays the same
`FindBookingPage.requestAcknowledged` text below the form in a `role="status"`
message after its `onSuccess` callback. Input changes clear that message.
`FindBookingForm.emailPlaceholder` provides the translated `you@example.com`
placeholder. The acknowledgement remains generic and never promises delivery.

Delivery does not check whether an account exists: it requires a matching booking
email. The checked Convex deployment had `RESEND_API_KEY` and a valid `PUBLIC_ORIGIN`
but no `EMAIL_FROM`; the existing shared sender throws before contacting Resend
when that setting is missing. Configure the intended verified sender in Convex.
No email was sent and no deployment environment values were changed during diagnosis.

Edited:

- `src/components/pages/(unprotected)/find-booking/find-booking-form.svelte`
- `messages/en.json`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

Validation: Svelte check reports zero errors/warnings; Svelte autofixer and
`bunx --bun oxlint` pass.

#### Chunk 3, aligned recovery UI

Both `/find-booking` and `/find-booking?token=…` use the default centered `Section`
width (`max-w-6xl`) and horizontal padding (`px-4 sm:px-6`), matching the site
header's left and right content edges. `FindBookingHeader` stays static and visible.
The email field keeps its label, placeholder and autofill hints, with a short
description explaining which email to use. The positive green acknowledgement
also tells the guest to check their inbox, spam folder and entered address.
An existing live region announces the acknowledgement when it appears.

Verified results use `FindBookingDetailsListHeader` through the `DataList`
header snippet. Booking rows compose the existing `Card`, `BookingStatusBadge`
and `Plural` components. Property names wrap, dates stay together on mobile,
and guests form a third column on larger screens. Loading placeholders match
the booking row layout. Invalid links offer a primary request-new-link button;
other states offer a secondary use-another-email button.

The shared search-parameter hook now notifies its readers after shallow URL
writes, including readers in another component. Clearing a token therefore
returns to the email form immediately. Loading/error/null authorization guards
still run before cached booking rows can render.

The email guidance follows the [GOV.UK email-address pattern](https://design-system.service.gov.uk/patterns/email-addresses/).
Visible acknowledgement and next steps follow the [GOV.UK confirmation pattern](https://design-system.service.gov.uk/patterns/confirmation-pages/).
Grouping related stay fields follows [NN/g's proximity guidance](https://www.nngroup.com/articles/gestalt-proximity/).
The exact widths, spacing and responsive columns are project design choices.

Created:

- `src/components/pages/(unprotected)/find-booking/find-booking-details-list-header.svelte`

Edited:

- `src/routes/(app)/(unprotected)/find-booking/+page.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-header.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-form.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details-item.svelte`
- `src/components/pages/(unprotected)/find-booking/loading/find-booking-details-loading.svelte`
- `src/hooks/useSearchParams.svelte.ts`
- `messages/en.json`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

Validation: Svelte check reports zero errors/warnings; Svelte autofixer and
`bunx --bun oxlint` pass. Browser checks at 390px and 1280px verified form
alignment, long property names, valid/empty/invalid results, the green
acknowledgement, cached-row hiding after access invalidation and returning to
the form after clearing the token. Results and email submission were mocked in
the isolated browser; no real emails were sent.

### Chunk 4 — Show recovered bookings and details

Indexed pagination, actual statuses and clearing the token were implemented
during the approved Chunk 3 iterations. Recovery now uses reusable links and the
public `bookings/queries/fetchBooking` query with an optional token, rather than
an action/session exchange or a separate detail query.

The current review step adds `FindBookingDetailsDialog` to each booking card.
It receives the existing `Booking` object, so opening it makes no extra request.
Native `commandfor` buttons open and close the read-only dialog. Its separate
header owns the accessible title and property/status summary; its content shows
dates, guest counts/name, email, phone and optional special requests. Removing
an invalidated booking row also removes its dialog. Upcoming/ongoing/Past tabs
remain a separate, unimplemented review step; account claiming stays in Chunk 5.

Created:

- `src/components/pages/(unprotected)/find-booking/find-booking-details-dialog/find-booking-details-dialog.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details-dialog/find-booking-details-dialog-header.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details-dialog/find-booking-details-dialog-content.svelte`

Edited:

- `src/components/pages/(unprotected)/find-booking/find-booking-details-item.svelte`
- `src/components/pages/(unprotected)/find-booking/loading/find-booking-details-loading.svelte`
- `messages/en.json`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`

Test cross-email access denial, forged booking IDs, expired tokens, empty
results, multiple pages and unavailable listings. Verify the page on mobile
and desktop and check native dialog keyboard/focus behavior. Complete the
Svelte and Oxlint checks.

Dialog checkpoint validation: Svelte check reports zero errors/warnings;
Svelte autofixer and `bunx --bun oxlint` pass. An isolated browser with synthetic
booking data verified native keyboard opening, close/focus restoration, the
existing Escape policy, mobile/desktop layout, no additional recovery query
subscription when opening, and removal of an open dialog when access is
invalidated. No real emails were sent or backend functions changed.

**Review checkpoint:** review the read-only booking details dialog.
Stop before implementing date tabs or account claiming.

### Chunk 5 — Explicitly add an anonymous booking to an account

**Implemented:** unowned recovery rows show **Add to my account**. Selecting it
saves the booking ID and token in this tab's session storage and opens the clean
`/guest/claim-booking` route. The existing protected layout and auth dialog handle
sign-in/sign-up and return to that route. The token never enters authentication
redirect URLs. Closing the tab removes this intent; direct entry without it
offers Find a booking.

The authenticated preview query checks the current Better Auth session and
user record, verified normalized account email, reusable token expiry/email scope,
and booking ownership. It displays the property, booking status, dates and email
before a Button asks for explicit confirmation. Reading the recovery list,
signing in or opening the confirmation page never changes ownership.

The confirmation mutation repeats those checks in its transaction. An unowned
booking gets the authenticated owner ID and one owner-aggregate entry atomically.
A retry by that same owner succeeds without inserting again; another owner's
booking is rejected. Success clears the stored intent and opens My bookings.
Status, completion metadata and recovery-token reuse remain unchanged; normal
review eligibility still applies. Expired links, email mismatch and unverified
accounts use translated backend errors.

Files created:

- `src/components/pages/(unprotected)/find-booking/find-booking-claim-button.svelte`
- `src/components/pages/(protected)/guest/claim-booking/claim-booking-header.svelte`
- `src/components/pages/(protected)/guest/claim-booking/claim-booking-content.svelte`
- `src/components/pages/(protected)/guest/claim-booking/loading/claim-booking-content-loading.svelte`
- `src/features/bookings/hooks/useClaimBooking.svelte.ts`
- `src/shared/features/bookings/schemas/claimBookingSchema.ts`
- `src/convex/tables/bookingRecoveryTokens/helpers/getBookingRecoveryToken.ts`
- `src/convex/tables/bookings/helpers/getBookingGuestDetails.ts`
- `src/convex/tables/bookings/helpers/getBookingToClaim.ts`
- `src/convex/tables/bookings/queries/fetchBookingToClaim.ts`
- `src/convex/tables/bookings/mutations/claimBooking.ts`

Files edited:

- `src/routes/(app)/(protected)/guest/claim-booking/+page.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details.svelte`
- `src/components/pages/(unprotected)/find-booking/find-booking-details-item.svelte`
- `src/convex/tables/bookings/queries/fetchBooking.ts`
- `src/convex/tables/bookings/validators/bookingValidators.ts`
- `src/shared/features/bookings/config.ts`
- `src/shared/features/bookings/types/bookingTypes.ts`
- `src/shared/types/types.ts`
- `src/utils/getBackendErrorMessage.ts`
- `messages/en.json`
- `tests/convex/bookingRecovery.test.ts`
- `docs/ProjectCodingRules.md`
- `docs/FindABookingSystemDesign.md`
- `src/convex/_generated/api.d.ts` (generated bindings)

Validation: 30 focused recovery, booking and review tests pass, including
current account verification, token/email scope, repeated and concurrent claims,
and aggregate rollback. Svelte check reports zero errors/warnings; the Svelte
autofixer and Oxlint pass. An isolated browser with mocked data verifies mobile
and desktop claim actions, clean auth redirects, retained tab intent, explicit
button confirmation, storage cleanup and the My bookings redirect. Live email,
OAuth-provider authentication and real booking ownership were not exercised.

The original scope and review checkpoint below still define the chunk.

The follow-up simplifies the fieldless confirmation to a Button. The feature
hook `useClaimBooking` owns validated tab storage, reactive claim args and the
mutation's pending state and duplicate-click guard. The calling components keep
navigation and translated success/error toasts. The former
`src/features/bookings/utils/bookingClaimIntent.ts` is removed.

Follow-up verification: Svelte check, autofixer, formatting and Oxlint pass.
The mocked browser check confirms that the fieldless Form is gone, rapid clicks
submit once, pending controls are disabled, failed claims retain their intent
for retry, and success clears storage and redirects to My bookings.

Follow-up file changes:

- Created `src/features/bookings/hooks/useClaimBooking.svelte.ts`.
- Removed `src/features/bookings/utils/bookingClaimIntent.ts`.
- Edited `src/components/pages/(protected)/guest/claim-booking/claim-booking-content.svelte`.
- Edited `src/components/pages/(unprotected)/find-booking/find-booking-claim-button.svelte`.
- Updated `docs/ProjectCodingRules.md` and this design document.

Connect **Add to my account** to the existing authentication and claim route.
Preserve valid recovery access through sign-in without putting its secret into
redirect URLs. Require matching verified account email and explicit guest
confirmation. Claim only unowned bookings and maintain the booking owner
aggregate atomically. Once claimed, the booking appears in My bookings.

Test account-email mismatch, expired grants, existing/conflicting ownership,
repeated claims, concurrent claims and aggregate consistency. Verify that
reading alone never claims a booking and that existing review eligibility
rules still apply. Complete the Svelte and Oxlint checks and update the domain
map to describe the implemented system.

**Review checkpoint:** review the claim flow and the final end-to-end journey.
Stop and hand over the finished implementation; deployment is a separate step.

## Research basis

The recovery entry points follow established booking support patterns:
[Booking.com's confirmation guidance](https://www.booking.com/tpi_faq.en-gb.html)
directs guests to their email confirmation or account bookings. Email-only
recovery is this project's recommendation, not a claim that Booking.com uses
this exact flow.

Token expiry, consistent public responses and abuse limits
follow [OWASP's recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
Applying those principles to guest booking access, the proposed lifetimes and
the chunk boundaries are design decisions for this project. Reusable read-only
booking links are the approved project decision; OWASP's single-use password
reset guidance is not the booking-token contract. Database-driven invalidation follows
[Convex's guidance on time-dependent queries](https://docs.convex.dev/understanding/best-practices).
