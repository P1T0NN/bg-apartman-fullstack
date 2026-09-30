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
  forgot-password screens; `/contact`, `/find-booking`, and `/help` are empty
  placeholder pages.
- `(app)/(protected)` contains the guest favorites, my-bookings, and settings
  screens and the host add-accommodation, my-accommodations, bookings, and
  dashboard screens; its server layout owns the authentication redirect and its
  `+layout@.svelte` owns the workspace shell. `/guest/claim-booking` and
  `/guest/my-bookings/[id]` are empty placeholders. `/host/dashboard` shows a
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

| Area                  | Existing pieces and intended use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accommodation form    | `add-accommodation-form.svelte` composes six step components. `useAccommodationForm.svelte.ts` owns values, step, `furthestStep`, and per-step `validate`, shared through `accommodationFormContext.ts`; the Continue button calls `validate`, which selects the step schema and calls `safeParse`. `saveAccommodationSchema` combines the six section schemas for Form submission and server validation. The location step uses `google-street-input.svelte` (Places proxy, `kind: 'street'`, two characters and a 300 ms debounce) and loads `google-map.svelte` with the authenticated `/api/geocode` proxy. `accommodation-amenities` and `useAmenityDialog.svelte.ts` commit only on Save. The upload field stays mounted to keep previews; only Publish uploads photos and calls `createAccommodation` (no drafts). |
| My-accommodation work | `my-accommodation-header.svelte` reads the owner summary (`fetchMyAccommodation`). The listing tab (`fetchMyAccommodationListing`) renders sections from `myAccommodationTabListingForm.ts` and saves through `updateAccommodation`; the calendar and settings tabs are visual only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Map search            | `useSearchAccommodations.svelte.ts` is one-shot cursor pagination (plain `client.query`, no live subscription, no `$effect`), loaded by an attachment when location, bounds, guests/rooms, applied stay filters, or sign-in state change. Both list and map queries use `buildAccommodationSearchQuery` and the validated `stayFilters`: inclusive decimal price range converted to minor units, exact property type, bedroom/bed/bathroom minimums, and all selected amenities (additional amenities are allowed). Applying or clearing filters resets list pagination and clears map pins; viewport changes retain those filters. `search-map.svelte` reports viewport bounds and moving state; `accommodation-card.svelte` renders rows and highlights hovered pins. `useSearchCriteria.svelte.ts` and `searchContext.ts` share criteria and sort labels; `search-filters.svelte` owns the filter button and `NativeDialog` trigger, takes type options from `ACCOMMODATION_FILTER_DEFS`, and applies a validated draft without a form. Its amenities section reuses the eight `POPULAR_AMENITY_KEYS`, `AccommodationAmenityItem`, and the nested `AccommodationAmenitiesDialog`; editor Save changes only the filter draft, Cancel discards editor changes, and only Show results applies search criteria. Cancellation, pets, and guest ratings are omitted; `search-toolbar.svelte` owns mobile sorting and the map toggle.                                                                                                                                |
| Favorites             | `useFavorites.svelte.ts` (shared through `favoritesContext.ts`) overlays optimistic per-viewer overrides on the server `seedIds`, rolls back with a toast on failure, and calls `updateFavoriteStatus`. `favorite-button.svelte` sends visitors to `onAuthRequired` instead of a mutation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Booking checkout      | `booking-checkout.svelte` submits `createBooking` with `createBookingFormFields()` and `booking-stay-dates.svelte`; `createBookingSchema(limits)` re-validates dates, stay limits, and capacity against the stored listing. The confirmation page reads `fetchBookingConfirmation` by booking id; `/guest/my-bookings` uses `fetchMyBookings`. There is no availability hold or payment yet.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Host bookings         | `/host/bookings` renders `fetchHostBookings` in a `DataTable` with `TabsUrl` status tabs driven by the `status` URL parameter, guest/stay/accommodation/status columns, with request age under the guest name and visible special-request markers, context-aware row actions, and a details dialog. `host-bookings-item-actions/` composes `host-bookings-confirm-button.svelte` and `host-bookings-cancel-button.svelte` (each owns its `NativeDialog`); all three confirm, decline, complete, or cancel through `updateBookingStatus`.                                                                                                                                                                                                                                                                                                                                                   |
| Guest settings        | `/guest/settings` groups Profile (name via `authClient.updateUser` + verified-email status), Security (password dialog via `changePassword`, active sessions via `listSessions`/`revokeSession`/`revokeOtherSessions`), and a danger zone (`deleteUser` with the `sendDeleteAccountVerification` email; the user record deletion runs the existing `cleanupDeletedUserData` trigger). Uses per-section explicit saves and typed-email confirmation.                                                                                                                                                                                                                                                                                                                                                                       |
| Feedback inbox        | `/feedback` submits `createFeedback`; admin `/admin/feedback` lists `fetchFeedbacksAdmin` with `FEEDBACK_FILTER_DEFS` and triages in `resolve-feedback-dialog.svelte` through `updateFeedbackStatus`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Newsletter signup     | `newsletters-section.svelte` renders `createNewsletterFields()` and submits the captcha-protected `subscribeToNewsletter` action, which always resolves after a fixed minimum delay; admin `/admin/newsletters` lists `fetchNewslettersAdmin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Guest continuity      | `useGuestLocal.svelte.ts` owns the browser's untrusted guest id (`GUESTS_CONFIG.STORAGE_KEY`, `crypto.randomUUID`); it is continuity only and never authorizes access, so email recovery works without it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

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
