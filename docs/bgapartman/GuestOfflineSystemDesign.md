# Guest booking and account ownership design

Status: architectural proposal; booking functionality is not implemented by this document.

Here, **offline** means booking without signing in. The booking still needs an
internet connection and server confirmation; this is not a design for booking
while disconnected from the internet.

## 1. Requested behavior

The proposed experience is:

1. A visitor receives a `guestId` stored in localStorage.
2. They book without an account, supplying an email address and phone number.
3. If they later create an account in that browser, bookings associated with
   that `guestId` move to the account, even if its email differs from the booking
   email.
4. If another account is later created with the original booking email, the
   booking moves to that account instead, revoking the first account's access.
5. After ownership is established, only that owner can access the booking
   through customer APIs. Any staff access must be a separate, explicit policy.

Example: browser `G` books using `alice@example.com`, then registers account A
with `other@example.com`. The requested rule initially assigns the booking to A.
When account B verifies `alice@example.com`, B should take ownership and A should
lose access.

The desired convenience is reasonable, but **creating an account and possessing
a browser ID are insufficient proof of booking ownership**. The distinction
between an association and permission to read private data is essential.

## 2. Recommendation

Start with a `bookings` table containing booking contact details and an optional
account owner. Do **not** insert a `guests` row for every visitor.

A random localStorage `guestId` can provide browser continuity, but must never
authorize viewing, claiming, modifying, or cancelling a booking. Store it on a
booking only if there is an actual continuity feature that needs it. Do not
store booking details or authentication secrets in localStorage. Browser
storage is accessible to JavaScript and its contents can be modified; OWASP
specifically advises against storing session identifiers there.
[OWASP local storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)

Use this ownership policy:

- A signed-in account with a verified matching email can claim eligible,
  unowned guest bookings.
- An account with a different email must complete a booking-specific challenge
  sent to the booking email before receiving ownership or private details.
- Once confirmed, ownership is tied to a stable account ID. Do not repeatedly
  transfer confirmed bookings whenever someone registers or changes an email.
- A conflicting claim against a confirmed owner requires an explicit transfer
  or support review.

This is a deliberate change to the proposed automatic transfer rule. Moving a
booking later cannot undo an earlier disclosure, cancellation, or malicious
edit. A shared browser also does not imply that its users are the same person.

Email verification proves current control of a mailbox, not a person's identity,
payment ownership, or historical entitlement. Shared, compromised, and recycled
mailboxes remain relevant. Original booking email is a useful claim mechanism,
not an infallible definition of the rightful owner.

## 3. Why contact details belong on bookings

A browser may be used by a family, a receptionist, or several unrelated guests.
One browser can create bookings with different emails and phone numbers. One
person can also book from several browsers.

Consequently, a `guests` record keyed by a browser ID is not a reliable customer
profile. Updating its email could incorrectly change the interpretation of all
previous bookings. Keep a contact snapshot on each booking instead.

| Approach                                               | Persistence                                                   | Fit for this website                                 |
| ------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------- |
| Insert a guest on every first visit                    | Rows for browsers and bots, including visitors who never book | Unnecessary for booking ownership                    |
| Store contacts and optional owner on each booking      | Rows are created when bookings are submitted                  | Recommended starting point                           |
| Create a guest session on first protected guest action | One expiring session per active guest browser                 | Add if persistent guest dashboard access is required |
| Maintain a customer profile                            | A distinct customer identity with its own lifecycle           | Add when a real customer-management feature needs it |

A separate table is not inherently expensive. The avoidable cost is writing
visitor records, updating activity timestamps, maintaining indexes, and cleaning
up records that never contribute to a booking.

## 4. Proposed data model

These are proposed fields, not changes to the current Convex schema. The current application has no booking model. Add booking records only after
designing the reservation lifecycle.

### `bookings`

| Field                            | Purpose                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `_id`, `_creationTime`           | Convex document identity and creation time                                                              |
| `ownerId?`                       | Stable Better Auth user ID after a successful claim; use the project's existing string owner convention |
| `originalBookingEmail`           | Immutable email supplied when the guest booking was created                                             |
| `originalBookingEmailNormalized` | Server-normalized email used for candidate lookup                                                       |
| `contactEmail`                   | Current address for booking communications; initially the original email                                |
| `contactPhone`                   | Required booking contact number; never sufficient proof of ownership                                    |
| `guestId?`                       | Optional, untrusted browser association; never an access credential                                     |
| `claimedAt?`                     | When ownership was established                                                                          |
| `claimMethod?`                   | For example, matching verified account email or booking email challenge                                 |

Reservation fields such as accommodation, dates, status, and price belong to
the booking model but are outside this ownership proposal. Payment identifiers
and payment history must not be silently reassigned by an ownership claim.

Normalize and validate contacts on the server. Use one email normalization
policy consistent with authentication, preserving the entered address for
communication. Do not invent provider-specific equivalences by stripping dots
or `+tags`. Phone formatting should include a country code; formatting does not
verify possession of a phone.

Changing `contactEmail` must not overwrite original claim evidence or alter
ownership. Correcting a mistyped original email requires a verified correction
flow or support review, with an audit trail.

### Indexes driven by actual queries

| Index fields                                | Query                                                           |
| ------------------------------------------- | --------------------------------------------------------------- |
| `ownerId`                                   | Paginated "my bookings" list                                    |
| `originalBookingEmailNormalized`, `ownerId` | Eligible unowned bookings for a verified email                  |
| `guestId`                                   | Optional browser association lookup, only if a feature needs it |

Convex appends `_creationTime` to indexes, allowing chronological ordering
without adding a duplicate creation field. Use equality ranges and bounded
pagination; a `.filter()` over an entire table does not make the underlying scan
cheap. [Convex indexes](https://docs.convex.dev/database/reading-data/indexes/)

An indexed lookup by `guestId` still requires authorization before returning
anything private. An unpredictable identifier is not a substitute for that
check.

### Booking email challenges

If a booking needs a challenge for guest access or a different-email claim,
persist only that challenge's verification state. A small `bookingClaims` table
is appropriate when this flow is implemented; it is created on demand, not on
page visits.

Each challenge needs a booking ID, purpose, token digest, expiry, and consumption
state. Account claims must also bind the challenge to the intended account ID.
Use a cryptographically random token; expire it, consume it once, and invalidate
it when the booking's authorization state changes. Reuse the existing email
delivery infrastructure, but keep booking claims separate from account-email
verification: claiming a booking must not change which email an account has
verified.

For this design, apply OWASP's recovery-token properties to booking challenges:
secure generation and storage, expiry, single use, generic request responses,
and rate limiting. Do not include raw tokens in logs or analytics. A link GET
should show a confirmation step; the state-changing POST consumes the token,
so an email scanner cannot claim a booking merely by opening the URL.
[OWASP recovery token guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

## 5. Recommended lifecycle

### Visit and guest checkout

1. Optionally create a local `guestId` using the browser's cryptographic UUID
   generator. There is no database request just to register the visitor.
2. Missing, blocked, or cleared localStorage must not prevent checkout. A new
   device can recover a booking through email verification.
3. Accept and validate email, phone, and reservation input on the server.
   Rate-limit public submission using trusted server request context, not just
   a freely replaceable guest ID. Reuse CAPTCHA where appropriate.
4. Create the booking with no `ownerId`. Retried submissions must not create
   duplicate reservations; handle idempotency in the booking creation flow.
5. Send confirmation through existing server email infrastructure. Later access
   to private details requires email proof or authenticated ownership. A booking
   reference alone must not reveal details.

Availability, pricing, and payment confirmation remain server responsibilities.
Browser continuity does not change those checks.

### Register or sign in with the booking email

1. Authenticate the account and read its current email and verification state
   from trusted server auth data.
2. After email verification, find eligible unowned bookings through the email
   index. Account creation alone never triggers a grant of access.
3. Claim them in bounded mutations, checking eligibility again inside each
   mutation. Only owned bookings appear in the account's private booking list.
4. Repeat reconciliation after sign-in when necessary, so an existing account
   can discover a guest booking made later or from another browser.

Better Auth supports email verification; the backend must explicitly check the
verified state for this claim flow, including social sign-in. Authentication
alone is insufficient. [Better Auth email verification](https://better-auth.com/docs/concepts/email)

Automatic email matching should apply only within a documented eligibility
window for unowned guest bookings, initially upcoming or active stays. Avoid
silently importing years of private booking history into a newly verified
mailbox. Historical and disputed claims should require additional booking
evidence and support review; another email OTP alone does not solve mailbox
reassignment.

### Register with a different email

1. Offer a claim flow for a booking the user identifies, with a generic response
   that does not expose its contact details or confirm its existence.
2. Send a challenge to the stored booking email, bound to that booking and the
   signed-in target account. Rate-limit requests and verification attempts.
3. Show an explicit confirmation of the destination account before completing
   the claim. Possession of the local `guestId` cannot complete it.
4. After successful verification, assign ownership to that account and revoke
   guest access. The account's own email can remain different.

Do not list booking details merely because the browser has associated IDs.
Anyone using a shared browser would otherwise inherit that information.

### Another account later verifies the original email

- If the booking is still unowned and eligible, it can be claimed normally.
- If ownership was already confirmed through an authorized flow, do not
  automatically replace it. Use explicit transfer or support review.
- If a provisional association exists under the optional policy below, the
  matching verified email may supersede it.

This makes ownership stable even if an account changes email. Account deletion
must also have an explicit reservation policy; it must not silently reopen
retained bookings for automatic claims by future holders of the same address.

## 6. If the original automatic reassignment behavior is required

Represent the first attachment as **provisional**, keeping it distinct from
confirmed ownership:

| State                           | Meaning                                                         | Later verified original-email claim                   |
| ------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Unowned                         | Guest booking has no account owner                              | Claim if eligible                                     |
| Provisionally associated with A | Browser association suggests A, but email ownership is unproven | Replace association with confirmed ownership by B     |
| Confirmed owner A               | A passed the required ownership proof                           | No automatic replacement; explicit transfer or review |

Use a separate `provisionalAccountId` if the product needs to persist this
association. Do not put an unverified account in `ownerId`, because normal
ownership checks would then authorize it. Provisional association must not
expose private details or permit edits or cancellation.

If immediate full access for A is required, A must present a real guest access
credential, not just localStorage `guestId`. A possible extension is an expiring
server-issued guest session in a `Secure`, `HttpOnly`, `SameSite` cookie, created
only when guest access is needed. Validate it at the server boundary and scope
its authority to the appropriate bookings. HttpOnly limits script access to the
credential; it does not prove which person is using the browser. Cookie-based
state changes also require CSRF/origin protection.

Even with that extension, automatically moving full ownership from A to B
cannot guarantee freedom from tampering or reverse data disclosure. This is a
product tradeoff, not a stronger security guarantee. The recommended launch
policy is verified claims with no provisional private access.

## 7. Authorization, atomicity, and revocation

For account access, every booking read, list, update, cancellation, attachment,
and export must enforce that the current authenticated user owns the booking.
Derive the user ID on the server; never trust a submitted `ownerId`, email,
`emailVerified`, phone number, or guest ID as an ownership assertion.

For an authorized claim or transfer, one Convex mutation must:

1. Read the booking's current ownership and relevant verification evidence.
2. Confirm the expected source state, target account, expiry, and eligibility.
3. Set the new owner and claim metadata.
4. Consume the claim and revoke any guest authorization for that booking.
5. Record the old owner, new owner, reason, and evidence type through the audit
   system, without recording secrets.

Retries for the same completed claim should be harmless. Competing claims must
recheck state and must never use an unconditional last-writer-wins update.
Convex mutations provide atomic transactions with serializable concurrency;
the eligibility checks still have to be written correctly. Email delivery runs
outside the ownership transaction through scheduled work.
[Convex atomicity](https://docs.convex.dev/database/advanced/occ)

If many bookings must be claimed, process bounded batches; do not make signup
scan or rewrite an unbounded history. Each booking changes ownership atomically.
Pending bookings remain inaccessible to an unverified claimant while processing
continues. Handle new bookings through later reconciliation too.

Revocation must be enforced on the server immediately after the ownership
mutation commits. Old guest credentials must fail even if their nominal expiry
has not passed. Existing owner checks must read current booking ownership, not
trust a long-lived token containing an old owner decision.

Clear booking views and client caches on logout, account switch, or loss of
access. Stop stale subscriptions and protect booking attachments independently;
public file URLs would bypass booking authorization. Previously downloaded data
cannot be recalled by changing the database owner.

## 8. Load and persistence costs

Let `V` be newly observed browsers and `B` be submitted bookings in a period.
Persisting every visitor creates roughly `V` guest inserts in addition to
booking writes. The recommended design creates `B` booking rows plus verification
records only when needed. For illustration, 100,000 browsers and 2,000 bookings
would avoid 100,000 visitor inserts; this is a workload example, not a monetary
savings estimate.

Use indexed, paginated owner/email lookups and bounded challenge cleanup. Avoid
visitor heartbeats, a database write on every page view, and guest-ID-based rate
limits that can be bypassed by generating another ID. Do not add a phone index
unless there is an authorized feature that actually queries by phone.

Measure real function calls, document sizes, reads, writes, index storage, and
email traffic before estimating operating cost. A lazily created guest-session
table is reasonable if the website later needs guest dashboards or independent
session revocation. That requirement does not justify a record for every visitor.

## 9. Fit with the current project

The current application has no `bookings` or `guests` table. Reuse these existing
pieces when implementing this proposal:

- `src/convex/betterAuth/config.ts`: Better Auth, email OTP, Google sign-in,
  CAPTCHA, and auth rate limiting. Password signup already requires email
  verification. Existing user triggers can be extended for reconciliation after
  a verified-email transition; preserve their aggregate and cleanup behavior.
- `src/convex/auth.ts`: server retrieval of current account email and verified
  status, plus exported auth component triggers.
- `src/convex/builders/convexFunctionBuilders.ts`: public and authenticated
  builders, validation boundaries, and existing rate-limit integration.
- Future booking queries must check ownership before returning private records.
- `src/convex/auditLogs`: existing audit infrastructure. Ownership changes need
  durable evidence; the current `logAuditEvent` helper catches scheduling
  failures, so do not assume using it alone guarantees an audit entry. Make
  required audit enqueueing fail the ownership mutation if it cannot be recorded.
- Existing email delivery and cache-clearing infrastructure; do not introduce a
  second auth system for bookings.

Before implementation, read the generated Convex guidance and finalize the
booking lifecycle, automatic-claim eligibility window, and support transfer
policy. This document adds no schema, routes, auth hooks, or runtime behavior.

## 10. Acceptance scenarios for implementation

| Scenario                                                       | Required result                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Visitor browses without booking                                | No guest database row is created                                                  |
| User edits or copies localStorage `guestId`                    | No private access or ownership grant                                              |
| Same browser makes bookings with different contact emails      | Each booking keeps its own contact snapshot                                       |
| Account is created but email is unverified                     | No automatic claim                                                                |
| Verified account email matches an eligible unowned booking     | Booking can be claimed without the old browser                                    |
| Account email differs from booking email                       | Booking email proof is required before private access                             |
| Original-email account appears after a provisional association | Association can be superseded; provisional account never received private details |
| Original-email account appears after a confirmed claim         | No silent reassignment                                                            |
| Two claims race or a claim is retried                          | One authorized owner; no duplicated transfer or reused challenge                  |
| Guest credential is used after account claim                   | Request is denied                                                                 |
| Email or guest ID is supplied to a discovery endpoint          | No private details or existence disclosure before authorization                   |
| localStorage is missing or another device is used              | Checkout works; email recovery remains available                                  |
| A confirmed owner changes email or deletes the account         | No automatic ownership grant to a later holder of the original address            |
| Unauthorized user requests a booking attachment directly       | The same booking access policy is enforced                                        |

These are future implementation checks, not tests executed by this documentation
change.

## 11. Implementation chunks

Ship these in order. Each chunk is complete and verifiable on its own; later
chunks assume the earlier ones exist. Do not start a chunk whose dependency is
missing — nothing that claims, moves, or transfers ownership can be written
before a booking exists.

| Chunk | Adds                                    | Depends on                 | Schema changes                  |
| ----- | --------------------------------------- | -------------------------- | ------------------------------- |
| 1     | Local guest id (client only) — done     | —                          | none                            |
| 2     | `bookings` table + guest booking create | reservation lifecycle      | `bookings`                      |
| 3     | Confirmation email + reference access   | chunk 2, existing emails   | none                            |
| 4     | Claim by verified matching email        | chunks 2–3                 | `bookings` indexes              |
| 5     | Claim with a different email            | chunk 4                    | `bookingClaims`                 |
| 6     | Provisional association / auto-reassign | chunk 5 + product decision | `bookings.provisionalAccountId` |
| 7     | Hardening + acceptance tests            | chunks 1–6                 | none                            |

### Chunk 1 — Local guest id (client only) — done

Status: done. Implemented in:

- `src/shared/features/guests/config.ts` — the localStorage key.
- `src/features/guests/hooks/useGuestLocal.svelte.ts` — `guestId`,
  `ensureGuestId()`, and `clearGuestId()`, backed by the shared
  `src/hooks/useLocalStorage.svelte.ts` and the `src/shared/utils/isUuid.ts`
  shape check; SSR-safe, and never throws when storage is missing, blocked, or
  full.

Usage once checkout exists: call `ensureGuestId()` when a guest checkout is
submitted and send the returned value as `guestId`. Do not create it on page
view, do not gate checkout on storage, and do not store anything else in
localStorage. This chunk adds no Convex table, query, mutation, route, or
booking field.

Verify once checkout exists: checkout still works with localStorage cleared or
blocked, the value is a UUID, and the id alone unlocks nothing on the server.

### Chunk 2 — Booking records and guest booking creation

Prerequisite: finalize the reservation lifecycle (accommodation, dates, guest
count, price snapshot, statuses) — outside this document.

- Add `bookings` to `src/convex/schema.ts` with the contact snapshot
  (`originalBookingEmail`, `originalBookingEmailNormalized`, `contactEmail`,
  `contactPhone`) and optional `guestId`, `ownerId`, `claimedAt`,
  `claimMethod`; add the indexes from §4.
- Create through a public builder in
  `src/convex/builders/convexFunctionBuilders.ts` with Zod validation, CAPTCHA,
  and rate limiting keyed on trusted request context, never on `guestId`.
- Store `guestId` only as an untrusted hint; never read by it.
- Make retried submissions idempotent (client submission key + server check) so
  one checkout cannot create two bookings.
- Reuse `src/convex/emails/*` for confirmation; do not add a second email path.

Do not create a `guests` table, and do not persist booking details client-side.

### Chunk 3 — Booking reference access and confirmation

- Send the confirmation through the existing email infrastructure.
- A booking reference alone reveals nothing: show state only after email proof
  or authenticated ownership.
- Reuse the existing page patterns (`SvelteHead`, loading/error/empty states)
  for the lookup route.

### Chunk 4 — Claim by verified matching email

- After Better Auth reports a verified email, reconcile eligible unowned
  bookings through `originalBookingEmailNormalized` in bounded batches.
- One mutation per booking: re-check eligibility, set
  `ownerId`/`claimedAt`/`claimMethod`, and record the change through
  `src/convex/auditLogs` (required audit enqueueing must fail the mutation).
- Repeat after sign-in so bookings made later or from another browser are found.
- Only owned bookings appear in customer booking queries.

### Chunk 5 — Claim with a different email (`bookingClaims`)

- Add `bookingClaims` (booking id, purpose, token digest, expiry, consumption,
  target account id); create records on demand, not per visit.
- Rate-limit requests and verifications, and return generic responses that do
  not confirm whether a booking exists.
- The GET link shows a confirmation step; the state-changing POST consumes the
  token once and assigns ownership atomically, revoking guest access.

### Chunk 6 — Deferred: provisional association and automatic reassignment

Implement only if the product explicitly requires the §6 behavior. It needs an
expiring, server-issued guest session (Secure/HttpOnly/SameSite cookie) before
any private access, and an unverified account must never sit in `ownerId`.
This is not part of the initial launch and must not be built while chunks 2–5
are missing.

### Chunk 7 — Hardening and acceptance tests

- Enforce ownership on every booking read, list, update, cancellation, and
  attachment; clear booking views and client caches on logout or account switch.
- Turn every §10 acceptance scenario into a `tests/convex` case, including the
  racing/retried claim and tampered-`guestId` rows.
