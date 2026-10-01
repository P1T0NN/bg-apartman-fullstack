# Project coding rules and reuse map

Domain map for this accommodation marketplace: routes, feature pieces, Convex
tables and functions, and the business rules that go with them. Global
engineering rules live in [`CodingRules.md`](./CodingRules.md); read that one
first. Longer domain notes are [`BookingPageDesign.md`](./BookingPageDesign.md)
and [`InfiniteScrollingSystemDesign.md`](./InfiniteScrollingSystemDesign.md).

## Routes

- `/` is the public home page (search card and newsletter section).
- `(app)/(unprotected)` contains the map search, accommodation detail, booking
  checkout and confirmation, feedback, sign-in, sign-up, verify-email, and
  forgot-password screens. `/find-booking` composes a static header and the shared
  `Form` for requesting a recovery email; `/contact` and `/help` are placeholders.
- `(app)/(protected)` contains the guest favorites, my-bookings, and settings
  screens and the host add-accommodation, my-accommodations, bookings, and
  dashboard screens; its server layout owns the authentication redirect and its
  `+layout@.svelte` owns the workspace shell. `/guest/claim-booking` previews and
  explicitly claims an unowned recovered booking after authentication;
  `/guest/my-bookings/[id]` remains an empty placeholder. `/host/dashboard` shows a
  standard heading and an owner-scoped pending-booking notice linking to
  `/host/bookings?status=pending`.
- `/admin` contains users, user detail, feedback, newsletters, and audit logs;
  `/admin/dashboard` and `/admin/accommodations` are empty placeholders. Its
  server layout owns authentication and admin-role redirects.
- `/api/auth/[...all]` is the Better Auth HTTP handler. `/api/geocode` is the
  authenticated Google Geocoding proxy; `/api/places/autocomplete` and
  `/api/places/[placeId]` are the Places proxies. `hooks.server.ts` injects the
  Convex token and sanitizes unexpected/validation errors.

## Domain feature pieces

| Area                  | Existing pieces and intended use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accommodation form    | `add-accommodation-form.svelte` composes six step components. `useAccommodationForm.svelte.ts` owns values, step, `furthestStep`, and per-step `validate`, shared through `accommodationFormContext.ts`; the Continue button calls `validate`, which selects the step schema and calls `safeParse`. `saveAccommodationSchema` combines the six section schemas for Form submission and server validation. The location step uses `google-street-input.svelte` (Places proxy, `kind: 'street'`, two characters and a 300 ms debounce) and loads `google-map.svelte` with the authenticated `/api/geocode` proxy. `accommodation-amenities` and `useAmenityDialog.svelte.ts` commit only on Save. The upload field stays mounted to keep previews; only Publish uploads photos and calls `createAccommodation` (no drafts).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| My-accommodation work | `my-accommodation-header.svelte` reads the owner summary (`fetchMyAccommodation`). The listing tab (`fetchMyAccommodationListing`) renders sections from `myAccommodationTabListingForm.ts` and saves through `updateAccommodation`; the calendar and settings tabs are visual only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Map search            | `useSearchAccommodations.svelte.ts` is one-shot cursor pagination (plain `client.query`, no live subscription, no `$effect`), loaded by an attachment when location, bounds, guests/rooms, applied stay filters, or sign-in state change. Both list and map queries use `buildAccommodationSearchQuery` and the validated `stayFilters`: inclusive decimal price range converted to minor units, exact property type, bedroom/bed/bathroom minimums, and all selected amenities (additional amenities are allowed). Applying or clearing filters resets list pagination and clears map pins; viewport changes retain those filters. `search-map.svelte` reports viewport bounds and moving state; `accommodation-card.svelte` renders rows and highlights hovered pins. `useSearchCriteria.svelte.ts` and `searchContext.ts` share criteria and sort labels; `search-filters.svelte` owns the filter button and `NativeDialog` trigger, takes type options from `ACCOMMODATION_FILTER_DEFS`, and applies a validated draft without a form. Its amenities section reuses the eight `POPULAR_AMENITY_KEYS`, `AccommodationAmenityItem`, and the nested `AccommodationAmenitiesDialog`; editor Save changes only the filter draft, Cancel discards editor changes, and only Show results applies search criteria. Cancellation, pets, and guest ratings are omitted; `search-toolbar.svelte` owns mobile sorting and the map toggle. |
| Favorites             | `useFavorites.svelte.ts` (shared through `favoritesContext.ts`) overlays optimistic per-viewer overrides on the server `seedIds`, rolls back with a toast on failure, and calls `updateFavoriteStatus`. `favorite-button.svelte` sends visitors to `onAuthRequired` instead of a mutation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Booking checkout      | `booking-checkout.svelte` submits `createBooking` with `createBookingFormFields()` and `booking-stay-dates.svelte`; `createBookingSchema(limits)` re-validates dates, stay limits, and capacity against the stored listing. The confirmation page reads `fetchBookingConfirmation` by booking id; `/guest/my-bookings` uses `fetchMyBookings`. There is no availability hold or payment yet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Host bookings         | `/host/bookings` renders `fetchHostBookings` in a `DataTable` with `TabsUrl` status tabs driven by the `status` URL parameter, guest/stay/accommodation/status columns, with request age under the guest name and visible special-request markers, context-aware row actions, and a details dialog. `host-bookings-item-actions/` composes `host-bookings-confirm-button.svelte` and `host-bookings-cancel-button.svelte` (each owns its `NativeDialog`); all three confirm, decline, complete, or cancel through `updateBookingStatus`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Guest settings        | `/guest/settings` groups Profile (name via `authClient.updateUser` + verified-email status), Security (password dialog via `changePassword`, active sessions via `listSessions`/`revokeSession`/`revokeOtherSessions`), and a danger zone (`deleteUser` with the `sendDeleteAccountVerification` email; the user record deletion runs the existing `cleanupDeletedUserData` trigger). Uses per-section explicit saves and typed-email confirmation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Feedback inbox        | `/feedback` submits `createFeedback`; admin `/admin/feedback` lists `fetchFeedbacksAdmin` with `FEEDBACK_FILTER_DEFS` and triages in `resolve-feedback-dialog.svelte` through `updateFeedbackStatus`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Newsletter signup     | `newsletters-section.svelte` renders `createNewsletterFields()` and submits the captcha-protected `subscribeToNewsletter` action, which always resolves after a fixed minimum delay; admin `/admin/newsletters` lists `fetchNewslettersAdmin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Guest continuity      | `useGuestLocal.svelte.ts` owns the browser's untrusted guest id (`GUESTS_CONFIG.STORAGE_KEY`, `crypto.randomUUID`); it is continuity only and never authorizes access, so email recovery works without it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

The host bookings page renders a desktop `DataTable` at 1280px and above and
a stacked `DataList` below that width. Both compose `host-bookings-item.svelte`
and share one query and pagination state.

The guest bookings list uses `my-booking-item.svelte` and
`loading/my-booking-item-loading.svelte`, with translations under
`MyBookingsPage.MyBookingItem` and `MyBookingsPage.MyBookingItemLoading`.
`fetchMyBookings` enriches only its owner-scoped page through `enrichBookingPage`
with the published accommodation name, city, country and cover URL. Removed
listings retain their booking with a null accommodation summary. Property,
status and dates remain visible; guest details use a native disclosure.

## Verified booking reviews

- Review constants live in `src/shared/features/reviews/config.ts`; shared
  eligibility and deadline logic live in `utils/canReviewBooking.ts` and
  `utils/getReviewDeadline.ts`. `schemas/reviewSchemas.ts` contains validation
  schemas only. Both browser and Convex callers import the owning module directly.
- `ReviewDialog` in `src/features/reviews/components/review-dialog` opens the
  review form in the existing `NativeDialog`. The primary Leave a review action
  sits in eligible completed-booking card footers; accommodation eligible-stay
  actions open the same dialog. There is no separate review-writing route.
  Trigger and Cancel buttons use native `commandfor` commands; dialog events
  initialize and unmount the form, while successful publication calls `close`.
  The dialog shows the property, stay dates and deadline, mounts the form only
  when opened, disables cancellation while submitting and closes after publishing.
  Already-reviewed stays open `MyReviewDetailsDialog` through a native command button.
  Its dialog, header and content live under the My reviews page's
  `my-review-details-dialog` folder; its skeleton lives in that page's `loading`
  folder. Translation keys use `MyReviewsPage.MyReviewDetailsDialog`,
  `MyReviewDetailsDialogHeader` and `MyReviewDetailsDialogContent`.
  The dialog queries the caller's review only while open when only its ID is
  available; My reviews items pass their existing full data without another fetch.
  Clicking an item or its View review button opens the same read-only dialog.
  There is no separate review-detail route.
  `/guest/my-reviews` lists the caller's submitted reviews, newest first, using
  indexed cursor pagination, including hidden reviews. The guest sidebar links
  to the list; the booking-card view action opens the detail dialog. `ReviewDialog` composes the
  existing `Form`, native rating radios, text input, preview and publish action.
- One review is allowed per completed booking, with no lifetime limit on
  repeat stays. The window ends at UTC midnight 90 days after the checkout
  date, matching the project's UTC date convention. Guests cannot edit a review.
- `Complete stay` means the host attests that the guest checked in, stayed and
  departed. The confirmation dialog states this explicitly. The shared
  `completeBooking` helper rejects any booking that is not confirmed or whose
  checkout date is still in the future. It records `completedAt`, `completedBy`
  and optional support `completionNote`; there is no automatic completion based
  on elapsed dates. Existing completed bookings remain reviewable within the window.
- `bookings.reviewId` is optional and remains set after moderation. The
  compound `by_owner_id_accommodation_id_status_review_id_check_out_date` index
  finds a viewer's completed, unreviewed stays within the review window without
  scanning their booking history. `useReviewDate` refreshes the UI at UTC
  midnight and on tab visibility changes; queries never read the wall clock.
- `reviews` stores `bookingId`, `accommodationId`, server-derived `ownerId`,
  public first-name snapshot, stay month, rating (integer 1–5), plain-text comment
  (1–2,000 trimmed characters), visibility and optional moderation metadata.
  Indexes cover booking uniqueness, author history, public property/status/date ordering,
  property/status/rating filters and admin status lists.
- `createReview` checks authenticated booking ownership, completed-stay dates,
  the server-clock deadline, published listing availability and self-review
  exclusion. It checks `by_booking_id` and inserts the review, records the
  booking receipt and updates the aggregate in one mutation. The index is not
  itself a uniqueness constraint. No guest edit/delete endpoint exists.
- `reviewsAggregate` uses the existing `@convex-dev/aggregate` dependency,
  namespace = accommodation ID, key = rating and sum = rating. Only published
  reviews are inserted. `getAccommodationReviewSummary` reads counts per rating
  and the sum (batched `getAccommodationReviewSummaries` serves search pages);
  hiding/restoring a review updates the aggregate in the same mutation.
- `fetchPublicAccommodation` includes `reviews` (the review summary). Public review pages
  return only ID, publication time, first name, stay month, rating and comment;
  booking IDs, author IDs and moderation details remain private.
- Public accommodation UI links the title's rating/count and Reviews navigation
  to `#reviews`, placed after amenities and before location. Detailed queries
  mount near the viewport through `useObserver` (`rootMargin: '300px'`), which
  latches visibility on first intersection and disconnects its observer.
  The initial preview has six newest reviews; Show all
  switches to ten-row cursor pages. Rating distribution is visible above five
  reviews and filters one star value at a time. Long comments expand inline.
  The shared `Reviews` component receives the list through a `reviews` snippet;
  `AccommodationReviews` owns the accommodation query and pagination under the
  accommodation page components. `AccommodationReviewsItem` renders public
  review content and is also reused by admin moderation. Their translations
  live under `AccommodationPage.AccommodationReviews` and
  `AccommodationPage.AccommodationReviewsItem`. Eligible-stay actions remain in
  `AccommodationReviewBookings` and `AccommodationReviewBookingItem`.
- `getReviewPage` composes the existing pagination helper and caps requests at
  20 requested items, 40 rows read and 128 KiB read, preserving smaller caller
  budgets and native cursor fields. Aggregate totals are attached only to
  unfiltered public lists. Browser memory retains one review page.
- `/admin/reviews` provides indexed cursor moderation with required reasons,
  reversible hide/restore, and `completeBookingAdmin` for support-confirmed
  checkout disputes. Admin and host completion share the same lifecycle/time
  guards. Hidden reviews remain visible to their author and administrators,
  cannot be replaced, and do not contribute to public scores.
- Review endpoints live under `api.tables.reviews`: mutations `createReview`,
  `updateReviewVisibility`; queries `fetchAccommodationReviews`,
  `fetchEligibleReviewBookings`, `fetchBookingReview`, `fetchReviewsAdmin`.
  Author receipt queries `fetchMyReviews` and `fetchMyReview` derive ownership
  from identity and return only review content, visibility and stay context;
  they never expose account IDs or moderation metadata. Removed listings retain
  their receipt with a null accommodation name, and unavailable or foreign
  review IDs return null.
  Anonymous bookings must be securely claimed before becoming reviewable;
  `/guest/claim-booking` performs this explicitly; existing completion and
  90-day review eligibility rules still apply after claiming.

## Convex data model

`src/convex/schema.ts` registers the app tables; each table lives under
`src/convex/tables/<table>/schema.ts` unless noted. Money is integer minor units
in `COMPANY_DATA.CURRENCY` (EUR); accommodation photos are ordered R2 keys.

- `accommodations`: `ownerId` (set server-side), name, description, `type`
  (`ACCOMMODATION_TYPES`), `spaceType` (`entire`/`private`/`shared`), `address`
  (street, streetNumber, city, optional postalCode, country),
  `latitude`/`longitude`, guests/bedrooms/beds/bathrooms, `pricePerNightMinor`,
  `amenities` (`AMENITY_KEYS`), `imageKeys` (first image is the cover),
  check-in/out `HH:mm` slots, `minimumStay`/`maximumStay`,
  smoking/pets/parties, `houseRules`, `status` (`published`), `updatedAt`.
  Indexes `by_owner_id`, `by_owner_id_type`, `by_address_country_city`,
  `by_latitude`; search index `search_name` on name with `ownerId`/`type`
  filter fields. Listings are created published; public detail reads and
  favorites require `status: 'published'`. `saveAccommodationSchema` validates
  every create/update; photo lists need at least five claimed, duplicate-free
  upload keys.
- `bookings`: `accommodationId`, guest contact and stay fields, `status`
  (`BOOKING_STATUSES`: pending/confirmed/declined/cancelled/completed; new
  bookings start `pending`), optional `ownerId` (set server-side for a
  signed-in guest; anonymous bookings stay claimable), `hostId` (owner of the
  booked accommodation, copied at creation; powers the host bookings page), and
  `searchText` (lowercased `"<lastName> <email>"`). Indexes `by_owner_id`,
  `by_host_id`, and `by_host_id_status`; search index `search_guest` with
  `ownerId`/`hostId`/`status` filter fields. `createBooking` re-checks the stay
  (past date, min/max stay, capacity) against the stored listing, writes
  `searchText`, and counts owned bookings in `bookingOwnerAggregate`;
  `updateBookingStatus` allows only `BOOKING_STATUS_TRANSITIONS` changes for the
  booking's own host.
- Booking recovery foundation (Chunk 1 of `FindABookingSystemDesign.md`):
  booking email is trimmed/lowercased on creation and indexed by
  `by_email_check_out_date`. `migrations/backfillBookingEmails` normalizes
  existing email and search text in resumable batches, preserving ownership,
  lifecycle and aggregate keys. Run the backfill before enabling recovery.
  `bookingRecoveryTokens` stores SHA-256 token hashes, normalized email,
  expiry and optional consumption time; `bookingRecoverySessions` stores
  separate session-secret hashes, email scope and expiry. Secret indexes
  support exact lookup. Individual internal callable files live under
  `tables/bookingRecoveryTokens` and `tables/bookingRecoverySessions`.
  They generate secure 32-byte secrets and issue reusable 15-minute tokens. The original exchange
  and session callables have been removed; compatibility table schemas remain for stored data.
  Lifetimes live in shared `bookings/config.ts`; the credential-format schema
  lives in shared `bookingsRecoveryTokens/schemas` and validates recovery link credentials.
  Shared `utils/secrets.ts` owns secure generation and SHA-256 hashing.
  These grants never sign in or claim a booking. Chunk 2 adds public
  `requestBookingRecoveryLink` under `bookingRecoveryTokens/actions`, using its
  shared operation schema, a silent global limit, hashed normalized-email
  cooldown/hourly limits and a uniform `null` acknowledgement for valid requests.
  Destination limit functions live in
  `bookingRecoveryTokens/ratelimiting/bookingRecoveryTokenRateLimits.ts`.
  Bucket names and policies are centralized in `rateLimits/bookingRecoveryRateLimits.ts`;
  the request action passes its imported policy to the existing action builder.
  It queues internal `deliverBookingRecoveryLink` without looking up bookings or
  waiting for Resend; that action issues a token only for matching bookings and
  uses the existing email sender. Provider failures log a fixed message without
  credentials or recipient details. The frontend passes `locale: getLocale()`;
  request validation forwards it through queued delivery to the email helper.
  `emails/translations/sendBookingRecoveryEmailTranslation.ts` supplies
  handwritten HTML/plain-text copy with English fallback. No Paraglide imports
  enter Convex; `utils/getTranslationLocale.ts` selects copy from the dictionary.
  The existing action builder accepts `rateLimit` options
  and enforces the global limit before the handler. The first review step of
  Chunk 3 connects `/find-booking` using the existing shared `Form`, one email
  field, the request schema and `locale: getLocale()`. `functionType="action"`
  calls the existing recovery request action; Form handles validation, pending
  state, errors and the generic success toast. The form also displays that same
  acknowledgement in a visible `role="status"` message after success, clearing it
  when the input changes, and uses a translated email placeholder. Its header has no state or props.
  `useSearchParams` reads the optional URL token. When present, keyed
  `FindBookingDetails` uses `useConvexPagination` with the public
  `bookings/queries/fetchBooking` query with an optional token. The query
  validates and hashes the token, checks expiry on execution and scopes bounded
  `by_email_check_out_date` pagination to the verified email. Only guest-facing
  fields are returned; invalid token access returns `null`. Without a token, the query requires identity and paginates only that account's owned bookings through `by_owner_id`; an invalid supplied token never falls back to owner access. The component checks live
  loading/error/null results before rendering potentially cached pagination data.
  Shared pagination supports nullable query results. Find booking imports `PAGINATION_CONFIG.DEFAULT_PAGE_SIZE` for its page size. Tokens are reusable until
  expiry; reads never consume them, extend expiry, claim bookings or create sessions.
  `bookingRecoveryTokens/crons/cleanupExpiredBookingRecoveryTokensCron` is an
  internal mutation registered every minute in root `crons.ts`. Its expiry index
  reads/deletes batches of 100 and schedules continuation when full. Deleting a
  token invalidates its subscriptions; cached results may remain until cleanup
  runs, including scheduler delay. All booking recovery settings live under `BOOKINGS_CONFIG` in shared bookings `config.ts`.
  The details loading component lives under `find-booking/loading`;
  `FindBookingDetailsItem` shows property, dates, guest counts and actual status,
  using the existing `BookingStatusBadge`. Accommodation names are required in
  the returned guest-booking contract; missing accommodation records raise the
  existing `ACCOMMODATION_NOT_FOUND` error. Invalid links can clear the token to request
  another; network errors offer retry. The header stays static and visible,
  and the page is `noindex`/`no-referrer`.
  `FindBookingDetailsDialog` renders the already-loaded `Booking` in a read-only
  `NativeDialog`, with native `commandfor` trigger/close buttons and an accessible
  title owned by `FindBookingDetailsDialogHeader`. Its content shows stay dates,
  guest counts/name, email, phone and optional special requests; it adds no query,
  action, loading state or client-side authorization. Live invalidation removes
  the row and its dialog together. Date tabs remain pending.
  Unowned rows expose Add to my account. Owned recovery rows explain that the
  booking is already linked to an account instead of silently hiding the action.
  The claim page places Find a booking inside its empty state; active previews
  and errors show it in a toolbar above the content.
  `useClaimBooking` under bookings/hooks retains the
  selected booking ID and recovery token in tab-scoped session storage across
  the existing sign-in/sign-up flow; auth redirects contain only the clean
  `/guest/claim-booking` URL. Storage is untrusted input, not authorization.
  `fetchBookingToClaim` previews one booking. It shares fresh token, normalized
  email, Better Auth session, verified account-email and ownership checks with
  `claimBooking`. Only explicit confirmation changes ownership; foreign owners
  are rejected. The confirmation uses a Button and the hook's `useMutation`,
  with reactive pending state, duplicate-click protection and safe error toasts.
  Same-owner retries are idempotent. Ownership and the
  `bookingOwnerAggregate` insertion commit together. Claiming preserves the
  booking status and completion metadata and keeps the recovery link reusable.
  Recovery views use the default `Section` width and padding to align with the
  site header's left/right content edges, and share a static page header.
  The form's green live acknowledgement includes inbox/spam guidance;
  its field description explains which booking email to enter.
  `FindBookingDetailsListHeader` owns the results heading through the `DataList`
  header snippet. Booking rows use existing `Card`, `BookingStatusBadge` and
  `Plural` components with responsive date/guest columns. Loading matches the
  row layout. A clear-token button returns to the form in every results state;
  `useSearchParams` notifies readers across components after shallow writes.
- `favorites`: `ownerId` + `accommodationId`; indexes `by_owner_id` and
  `by_owner_id_accommodation_id`. `updateFavoriteStatus` inserts or deletes for
  published listings; the favorites list resolves each row to its accommodation
  and drops unpublished or deleted ones.
- `feedbacks`: optional signed-in snapshot (`userId`/`userName`/`userEmail`),
  `type` (`bug`/`question`), `category` (booking/payment/account/accommodation/
  other), title, message, optional guest `email`, `status`
  (`unresolved`/`resolved`), optional `resolvedAt`, and `searchText` (lowercased
  title + message). Indexes `by_type`, `by_category`, `by_type_category`; search
  index `search_feedback` with type/category filter fields.
- `newsletters`: one row per normalized (trimmed, lowercased) email with
  `status` (`subscribed`/`unsubscribed`), `subscribedAt`, and optional
  `unsubscribedAt`. Index `by_email` (upsert key) and search index
  `search_email`; writes go through the internal `upsertNewsletterSubscriber`.
- `storageUploads`: `ownerId`, `key`, optional expected size/content type,
  `status` (`pending`/`uploaded`), `createdAt`. Indexes `by_key`,
  `by_owner_id_created_at`, `by_created_at`. The authenticated upload builders
  verify caller-owned, uploaded, non-duplicate keys and delete the records on
  success.
- Counts come from `@convex-dev/aggregate` (`accommodationOwnerAggregate` keyed
  by owner + type, `bookingOwnerAggregate` by owner, `feedbackAggregate`,
  `newsletterAggregate`, `userTotalAggregate`), never from table scans.
- Better Auth owns its component tables (`user`, `session`, `account`,
  verification, rate-limit/JWKS) under `betterAuth/component`; admin user
  queries proxy through the component.

## App-facing functions

Current app-facing functions are:

- `api.auth.getCurrentUser` supplies the root layout's session/user summary;
- public accommodations: `api.tables.accommodations.queries.fetchAccommodationsSearch`
  (bounded map/list page with `listPageArgs`, optional `bounds`, `location`, and
  guest/room minimums and optional `stayFilters`; returns `favoriteIds` for the signed-in caller) and
  `fetchPublicAccommodation` (published detail without `ownerId`/`imageKeys`);
- owner accommodations: `fetchMyAccommodations` (owner page + filters and an
  aggregate total when no search), `fetchMyAccommodation` (header summary),
  `fetchMyAccommodationListing` (full owner listing), `createAccommodation`
  (upload mutation), and `updateAccommodation` (owner-scoped section patch);
- bookings: public `createBooking`, `fetchBookingConfirmation` (the booking id
  acts as the guest capability token), authenticated `fetchMyBookings`, and the
  host-scoped `fetchHostBookings` (indexed page, search, status filter; pending
  oldest first, all other statuses newest first),
  `hasPendingHostBookings` (boolean existence check using `by_host_id_status`
  and `.take(1)`, no aggregate), and `updateBookingStatus` (transition-guarded
  lifecycle actions);
- favorites: `fetchFavorites` and `updateFavoriteStatus`;
- feedback: public `createFeedback`, admin `fetchFeedbacksAdmin` and
  `updateFeedbackStatus`;
- newsletters: admin `fetchNewslettersAdmin` and the public
  `subscribeToNewsletter` action (which writes through the internal
  `upsertNewsletterSubscriber`);
- booking recovery: `fetchBooking` (bounded token-scoped read-only page or
  authenticated owner page), authenticated `fetchBookingToClaim` and
  `claimBooking`, and public `requestBookingRecoveryLink` (validated email;
  generic acknowledgement with silent global/destination limits and queued
  internal delivery; never returns a token, booking existence or delivery status);
- admin users: `fetchUsersAdmin`, `fetchUserProfileAdmin`,
  `fetchUserSettingsAdmin`, `fetchUserSessionsAdmin`, `fetchUserLogsAdmin`, and
  `fetchUserBreadcrumbAdmin`; audit logs: `fetchAuditLogsAdmin`;
- storage: `api.storage.r2.generateUploadUrl`, `syncMetadata`, and
  `deleteObject` (used by `Form`);
- search: `api.search.queries.fetchSearchSuggestions` (bounded public demo
  suggestions, minimum two characters, maximum seven results).

## Domain rules

- Operation schemas are named after the function (`saveAccommodationSchema`,
  `createBookingSchema`, `createFeedbackSchema`, `subscribeToNewsletterSchema`);
  reusable data schemas keep descriptive names.
- `ADMIN_USERS_FILTER_DEFS` (role/status/verification), `FEEDBACK_FILTER_DEFS`
  (type/category), and `ACCOMMODATION_FILTER_DEFS` (type) feed `useFilters`; the
  server re-reads symbolic values through `readAccommodationFilters` /
  `readFeedbackFilters` and ignores unknown keys.
- `$effect` remains deliberately only in `useCachedConvexQuery.svelte.ts` and
  `useConvexPagination.svelte.ts` for external cache synchronization without a
  `useQuery` success callback; `useSearchAccommodations` deliberately uses an
  attachment instead. UI primitives own their internal effects.
- Forms collect a decimal `nightlyPrice` and Convex stores
  `pricePerNightMinor` as integer minor units. Check-in/out times use `HH:mm`
  30-minute slots, and photos require at least five keys.
- `/api/geocode` requires authentication and the add flow only stores
  coordinates after it succeeds; editing the address clears stale coordinates.
  `address.streetNumber` is optional text, and country controls store the
  country name.
- A viewport `bounds` replaces the destination scope so panning across cities
  works; `south <= north` is validated and longitude wrap is handled in-query.
  Guest/bedroom minimums, scalar stay filters, and longitude filters run as in-query `filter`s
  because one query may call `.paginate()` once; map reads cap
  `maximumRowsRead`. Amenity inclusion uses the installed `convex-helpers/server/filter` on each bounded indexed page, preserving the cursor even for empty matches; the client continues pagination until the visible list batch is full or the map cursor is exhausted.
- `total` is attached only when no search/filters are active: owner
  accommodations (`accommodationOwnerAggregate`, plus the type-filtered
  aggregate total when only `type` is active), my-bookings
  (`bookingOwnerAggregate`), feedback (`feedbackAggregate`), and newsletters
  (`newsletterAggregate`); all other search/filtered totals are omitted.
- `subscribeToNewsletter` always resolves after a fixed minimum delay and its
  global rate limit is silent, so the response never reveals whether an email
  exists.
- `GUESTS_CONFIG.STORAGE_KEY` holds an untrusted browser guest id; `useGuestLocal`
  never overwrites it on sign-in and it never authorizes a booking.
- Owner-scoped data derives `ownerId` from the Better Auth identity
  (`getOwnerId`); the client never sends an owner id.
- Amenity keys, icons, categories, and the eight popular shortcuts live in
  `src/shared/features/accommodations/data/accommodationsData.ts` (kept
  translation-free because `saveAccommodationSchema` is bundled by Convex);
  `utils/getAmenities.ts` resolves their labels. The browser map reads
  `PUBLIC_GOOGLE_MAPS_API_KEY`/`PUBLIC_GOOGLE_MAPS_MAP_ID`; the geocode proxy
  reads `GOOGLE_GEOCODING_API_KEY` privately.
