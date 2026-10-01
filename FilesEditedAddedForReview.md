# Files edited and added for the review system

This inventory covers the review implementation, its tests, translations, generated API and project documentation.

## Edited files (22)

- `docs/ProjectCodingRules.md`
- `messages/en.json`
- `src/components/pages/(protected)/guest/my-bookings/my-booking-item.svelte`
- `src/components/pages/(protected)/host/bookings/host-bookings-item-actions/host-bookings-item-actions.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-details/accommodation-details.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-header.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-navigation.svelte`
- `src/convex/_generated/api.d.ts`
- `src/convex/convex.config.ts`
- `src/convex/schema.ts`
- `src/convex/tables/accommodations/queries/fetchPublicAccommodation.ts`
- `src/convex/tables/bookings/mutations/updateBookingStatus.ts`
- `src/convex/tables/bookings/schema.ts`
- `src/routes/(app)/(protected)/guest/my-bookings/+page.svelte`
- `src/routes/admin/+layout.svelte`
- `src/shared/constants/pageEndpoints.ts`
- `src/shared/features/accommodations/types/accommodationTypes.ts`
- `src/shared/features/bookings/schemas/bookingSchemas.ts`
- `src/shared/types/types.ts`
- `src/utils/getBackendErrorMessage.ts`
- `tests/convex/accommodations.test.ts`
- `tests/convex/bookings.test.ts`

## Added files (33)

- `src/components/pages/(protected)/host/bookings/host-bookings-item-actions/host-bookings-complete-button.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-review-booking-item.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-review-bookings.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-review-item.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-review-list.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-reviews.svelte`
- `src/components/pages/(unprotected)/accommodation/loading/accommodation-review-loading.svelte`
- `src/components/pages/admin/reviews/admin-review-item.svelte`
- `src/components/pages/admin/reviews/admin-review-support.svelte`
- `src/components/pages/admin/reviews/admin-reviews-header.svelte`
- `src/components/pages/admin/reviews/loading/admin-review-loading.svelte`
- `src/convex/tables/bookings/helpers/completeBooking.ts`
- `src/convex/tables/bookings/mutations/completeBookingAdmin.ts`
- `src/convex/tables/reviews/aggregates/reviewAggregate.ts`
- `src/convex/tables/reviews/helpers/getReviewPage.ts`
- `src/convex/tables/reviews/helpers/getReviewSummary.ts`
- `src/convex/tables/reviews/mutations/createReview.ts`
- `src/convex/tables/reviews/mutations/updateReviewVisibility.ts`
- `src/convex/tables/reviews/queries/fetchAccommodationReviews.ts`
- `src/convex/tables/reviews/queries/fetchBookingReview.ts`
- `src/convex/tables/reviews/queries/fetchEligibleReviewBookings.ts`
- `src/convex/tables/reviews/queries/fetchReviewsAdmin.ts`
- `src/convex/tables/reviews/schema.ts`
- `src/convex/tables/reviews/validators/reviewValidators.ts`
- `src/features/reviews/components/review-dialog/review-dialog.svelte`
- `src/features/reviews/hooks/useReviewDate.svelte.ts`
- `src/routes/admin/reviews/+page.svelte`
- `src/shared/features/reviews/schemas/reviewSchemas.ts`
- `src/shared/features/reviews/config.ts`
- `src/shared/features/reviews/utils/getReviewDeadline.ts`
- `src/shared/features/reviews/utils/canReviewBooking.ts`
- `src/shared/features/reviews/types/reviewTypes.ts`
- `tests/convex/reviews.test.ts`

## Handoff notes

- One immutable review per completed booking; repeat stays can each earn a review within the 90-day window.
- Completion uses a host attestation that the guest checked in, stayed and departed; administrators can resolve completion disputes.
- Anonymous booking claiming remains a separate feature.
- Verification passed: 56 tests, Oxlint, Svelte check (zero errors/warnings), production build and responsive browser checks.
- Convex functions were synchronized with the development deployment.
- Existing changes in `src/convex/tables/accommodations/helpers/buildAccommodationSearchQuery.ts` predated this work and are excluded from this inventory.
- `FilesEditedAddedForReview.md` is this root-level handoff inventory.
