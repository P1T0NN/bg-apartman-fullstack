/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates_helpers_getFilteredTotalAggregate from "../aggregates/helpers/getFilteredTotalAggregate.js";
import type * as aggregates_helpers_getTotalSizeAggregate from "../aggregates/helpers/getTotalSizeAggregate.js";
import type * as aggregates_utils_getPrefixRangeBoundsAggregate from "../aggregates/utils/getPrefixRangeBoundsAggregate.js";
import type * as auditLogs_helpers_logAuditBulk from "../auditLogs/helpers/logAuditBulk.js";
import type * as auditLogs_helpers_logAuditChange from "../auditLogs/helpers/logAuditChange.js";
import type * as auditLogs_helpers_logAuditEvent from "../auditLogs/helpers/logAuditEvent.js";
import type * as auditLogs_mutations_cleanupAuditLogs from "../auditLogs/mutations/cleanupAuditLogs.js";
import type * as auditLogs_mutations_writeAuditBulk from "../auditLogs/mutations/writeAuditBulk.js";
import type * as auditLogs_mutations_writeAuditChange from "../auditLogs/mutations/writeAuditChange.js";
import type * as auditLogs_mutations_writeAuditEvent from "../auditLogs/mutations/writeAuditEvent.js";
import type * as auditLogs_queries_fetchAuditLogsAdmin from "../auditLogs/queries/fetchAuditLogsAdmin.js";
import type * as auditLogs_types_auditLogsTypes from "../auditLogs/types/auditLogsTypes.js";
import type * as auth from "../auth.js";
import type * as betterAuth_auth from "../betterAuth/auth.js";
import type * as betterAuth_cleanupDeletedUserData from "../betterAuth/cleanupDeletedUserData.js";
import type * as betterAuth_config from "../betterAuth/config.js";
import type * as betterAuth_emails_sendDeleteAccountVerificationEmail from "../betterAuth/emails/sendDeleteAccountVerificationEmail.js";
import type * as betterAuth_emails_sendVerificationOTPEmail from "../betterAuth/emails/sendVerificationOTPEmail.js";
import type * as betterAuth_helpers_checkAccountDeletionRestrictions from "../betterAuth/helpers/checkAccountDeletionRestrictions.js";
import type * as betterAuth_helpers_requireIdentity from "../betterAuth/helpers/requireIdentity.js";
import type * as betterAuth_helpers_sendOtpEmail from "../betterAuth/helpers/sendOtpEmail.js";
import type * as betterAuth_queries_checkAccountDeletion from "../betterAuth/queries/checkAccountDeletion.js";
import type * as betterAuth_tables_users_aggregates_userTotalAggregate from "../betterAuth/tables/users/aggregates/userTotalAggregate.js";
import type * as betterAuth_tables_users_helpers_filterPredicates from "../betterAuth/tables/users/helpers/filterPredicates.js";
import type * as betterAuth_tables_users_migrations_backfillUserTotal from "../betterAuth/tables/users/migrations/backfillUserTotal.js";
import type * as betterAuth_tables_users_queries_fetchUserBreadcrumbAdmin from "../betterAuth/tables/users/queries/fetchUserBreadcrumbAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserLogsAdmin from "../betterAuth/tables/users/queries/fetchUserLogsAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserProfileAdmin from "../betterAuth/tables/users/queries/fetchUserProfileAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserSessionsAdmin from "../betterAuth/tables/users/queries/fetchUserSessionsAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUserSettingsAdmin from "../betterAuth/tables/users/queries/fetchUserSettingsAdmin.js";
import type * as betterAuth_tables_users_queries_fetchUsersAdmin from "../betterAuth/tables/users/queries/fetchUsersAdmin.js";
import type * as builders_convexFunctionBuilders from "../builders/convexFunctionBuilders.js";
import type * as contact_mutations_sendContactForm from "../contact/mutations/sendContactForm.js";
import type * as crons from "../crons.js";
import type * as emails_data_emailData from "../emails/data/emailData.js";
import type * as emails_sendEmail from "../emails/sendEmail.js";
import type * as emails_templates_footerTemplate from "../emails/templates/footerTemplate.js";
import type * as emails_templates_headerTemplate from "../emails/templates/headerTemplate.js";
import type * as emails_translations_sendBookingCancellationEmailTranslation from "../emails/translations/sendBookingCancellationEmailTranslation.js";
import type * as emails_translations_sendBookingConfirmationEmailTranslation from "../emails/translations/sendBookingConfirmationEmailTranslation.js";
import type * as emails_translations_sendBookingExpirationEmailTranslation from "../emails/translations/sendBookingExpirationEmailTranslation.js";
import type * as emails_translations_sendBookingRecoveryEmailTranslation from "../emails/translations/sendBookingRecoveryEmailTranslation.js";
import type * as emails_translations_sendBookingRequestEmailTranslation from "../emails/translations/sendBookingRequestEmailTranslation.js";
import type * as emails_types_emailTypes from "../emails/types/emailTypes.js";
import type * as helpers_getPagination from "../helpers/getPagination.js";
import type * as helpers_paginateSearch from "../helpers/paginateSearch.js";
import type * as http from "../http.js";
import type * as migrations_backfillAccommodationCancellationPolicies from "../migrations/backfillAccommodationCancellationPolicies.js";
import type * as migrations_backfillAccommodationRecommendationScores from "../migrations/backfillAccommodationRecommendationScores.js";
import type * as migrations_backfillAccommodationTimeZones from "../migrations/backfillAccommodationTimeZones.js";
import type * as migrations_backfillBookingEmails from "../migrations/backfillBookingEmails.js";
import type * as migrations_backfillBookingTiming from "../migrations/backfillBookingTiming.js";
import type * as migrations_backfillOwnerIds from "../migrations/backfillOwnerIds.js";
import type * as migrations_migrations from "../migrations/migrations.js";
import type * as migrations_removeBookingEmailRetryState from "../migrations/removeBookingEmailRetryState.js";
import type * as migrations_types_migrationTypes from "../migrations/types/migrationTypes.js";
import type * as rateLimits_bookingRecoveryRateLimits from "../rateLimits/bookingRecoveryRateLimits.js";
import type * as rateLimits_helpers_enforceRateLimit from "../rateLimits/helpers/enforceRateLimit.js";
import type * as rateLimits_types_rateLimitTypes from "../rateLimits/types/rateLimitTypes.js";
import type * as search_queries_fetchSearchSuggestions from "../search/queries/fetchSearchSuggestions.js";
import type * as seed from "../seed.js";
import type * as sorting_calculateRecommendationScore from "../sorting/calculateRecommendationScore.js";
import type * as storage_actions from "../storage/actions.js";
import type * as storage_getUploadByKey from "../storage/getUploadByKey.js";
import type * as storage_r2 from "../storage/r2.js";
import type * as tables_accommodations_aggregates_accommodationOwnerAggregate from "../tables/accommodations/aggregates/accommodationOwnerAggregate.js";
import type * as tables_accommodations_helpers_buildAccommodationSearchQuery from "../tables/accommodations/helpers/buildAccommodationSearchQuery.js";
import type * as tables_accommodations_helpers_getAccommodationsByGuestRatingSort from "../tables/accommodations/helpers/getAccommodationsByGuestRatingSort.js";
import type * as tables_accommodations_helpers_getAccommodationsByPriceSort from "../tables/accommodations/helpers/getAccommodationsByPriceSort.js";
import type * as tables_accommodations_helpers_getAccommodationsByRecommendedSort from "../tables/accommodations/helpers/getAccommodationsByRecommendedSort.js";
import type * as tables_accommodations_helpers_getMyAccommodationPage from "../tables/accommodations/helpers/getMyAccommodationPage.js";
import type * as tables_accommodations_helpers_readAccommodationFilters from "../tables/accommodations/helpers/readAccommodationFilters.js";
import type * as tables_accommodations_helpers_updateAccommodationReviewSortKeys from "../tables/accommodations/helpers/updateAccommodationReviewSortKeys.js";
import type * as tables_accommodations_mutations_createAccommodation from "../tables/accommodations/mutations/createAccommodation.js";
import type * as tables_accommodations_mutations_updateAccommodation from "../tables/accommodations/mutations/updateAccommodation.js";
import type * as tables_accommodations_queries_fetchAccommodationsMapSearch from "../tables/accommodations/queries/fetchAccommodationsMapSearch.js";
import type * as tables_accommodations_queries_fetchAccommodationsSearch from "../tables/accommodations/queries/fetchAccommodationsSearch.js";
import type * as tables_accommodations_queries_fetchMyAccommodation from "../tables/accommodations/queries/fetchMyAccommodation.js";
import type * as tables_accommodations_queries_fetchMyAccommodationListing from "../tables/accommodations/queries/fetchMyAccommodationListing.js";
import type * as tables_accommodations_queries_fetchMyAccommodations from "../tables/accommodations/queries/fetchMyAccommodations.js";
import type * as tables_accommodations_queries_fetchPublicAccommodation from "../tables/accommodations/queries/fetchPublicAccommodation.js";
import type * as tables_accommodations_utils_resolveImageUrls from "../tables/accommodations/utils/resolveImageUrls.js";
import type * as tables_accommodations_validators_accommodationValidators from "../tables/accommodations/validators/accommodationValidators.js";
import type * as tables_bookingRecoveryTokens_actions_deliverBookingRecoveryLink from "../tables/bookingRecoveryTokens/actions/deliverBookingRecoveryLink.js";
import type * as tables_bookingRecoveryTokens_actions_issueBookingRecoveryToken from "../tables/bookingRecoveryTokens/actions/issueBookingRecoveryToken.js";
import type * as tables_bookingRecoveryTokens_actions_requestBookingRecoveryLink from "../tables/bookingRecoveryTokens/actions/requestBookingRecoveryLink.js";
import type * as tables_bookingRecoveryTokens_crons_cleanupExpiredBookingRecoveryTokensCron from "../tables/bookingRecoveryTokens/crons/cleanupExpiredBookingRecoveryTokensCron.js";
import type * as tables_bookingRecoveryTokens_emails_sendBookingRecoveryEmail from "../tables/bookingRecoveryTokens/emails/sendBookingRecoveryEmail.js";
import type * as tables_bookingRecoveryTokens_helpers_getBookingRecoveryToken from "../tables/bookingRecoveryTokens/helpers/getBookingRecoveryToken.js";
import type * as tables_bookingRecoveryTokens_mutations_storeBookingRecoveryToken from "../tables/bookingRecoveryTokens/mutations/storeBookingRecoveryToken.js";
import type * as tables_bookingRecoveryTokens_ratelimiting_bookingRecoveryTokenRateLimits from "../tables/bookingRecoveryTokens/ratelimiting/bookingRecoveryTokenRateLimits.js";
import type * as tables_bookingRecoveryTokens_validators_bookingRecoveryTokenValidators from "../tables/bookingRecoveryTokens/validators/bookingRecoveryTokenValidators.js";
import type * as tables_bookings_aggregates_bookingOwnerAggregate from "../tables/bookings/aggregates/bookingOwnerAggregate.js";
import type * as tables_bookings_crons_expireBookingRequestsCron from "../tables/bookings/crons/expireBookingRequestsCron.js";
import type * as tables_bookings_emails_sendBookingCancellationEmail from "../tables/bookings/emails/sendBookingCancellationEmail.js";
import type * as tables_bookings_emails_sendBookingConfirmationEmail from "../tables/bookings/emails/sendBookingConfirmationEmail.js";
import type * as tables_bookings_emails_sendBookingExpirationEmail from "../tables/bookings/emails/sendBookingExpirationEmail.js";
import type * as tables_bookings_emails_sendBookingRequestEmail from "../tables/bookings/emails/sendBookingRequestEmail.js";
import type * as tables_bookings_helpers_completeBooking from "../tables/bookings/helpers/completeBooking.js";
import type * as tables_bookings_helpers_enrichBookingPage from "../tables/bookings/helpers/enrichBookingPage.js";
import type * as tables_bookings_helpers_getBookingGuestDetails from "../tables/bookings/helpers/getBookingGuestDetails.js";
import type * as tables_bookings_helpers_getBookingToClaim from "../tables/bookings/helpers/getBookingToClaim.js";
import type * as tables_bookings_helpers_getHostBookingPage from "../tables/bookings/helpers/getHostBookingPage.js";
import type * as tables_bookings_helpers_readBookingFilters from "../tables/bookings/helpers/readBookingFilters.js";
import type * as tables_bookings_mutations_cancelBooking from "../tables/bookings/mutations/cancelBooking.js";
import type * as tables_bookings_mutations_claimBooking from "../tables/bookings/mutations/claimBooking.js";
import type * as tables_bookings_mutations_completeBookingAdmin from "../tables/bookings/mutations/completeBookingAdmin.js";
import type * as tables_bookings_mutations_createBooking from "../tables/bookings/mutations/createBooking.js";
import type * as tables_bookings_mutations_enqueueBookingCancellationEmail from "../tables/bookings/mutations/enqueueBookingCancellationEmail.js";
import type * as tables_bookings_mutations_updateBookingStatus from "../tables/bookings/mutations/updateBookingStatus.js";
import type * as tables_bookings_queries_fetchBooking from "../tables/bookings/queries/fetchBooking.js";
import type * as tables_bookings_queries_fetchBookingConfirmation from "../tables/bookings/queries/fetchBookingConfirmation.js";
import type * as tables_bookings_queries_fetchBookingToClaim from "../tables/bookings/queries/fetchBookingToClaim.js";
import type * as tables_bookings_queries_fetchHostBookings from "../tables/bookings/queries/fetchHostBookings.js";
import type * as tables_bookings_queries_fetchMyBookings from "../tables/bookings/queries/fetchMyBookings.js";
import type * as tables_bookings_queries_hasPendingHostBookings from "../tables/bookings/queries/hasPendingHostBookings.js";
import type * as tables_bookings_validators_bookingValidators from "../tables/bookings/validators/bookingValidators.js";
import type * as tables_favorites_helpers_enrichFavoritePage from "../tables/favorites/helpers/enrichFavoritePage.js";
import type * as tables_favorites_helpers_getFavoriteIds from "../tables/favorites/helpers/getFavoriteIds.js";
import type * as tables_favorites_mutations_updateFavoriteStatus from "../tables/favorites/mutations/updateFavoriteStatus.js";
import type * as tables_favorites_queries_fetchFavorites from "../tables/favorites/queries/fetchFavorites.js";
import type * as tables_feedbacks_aggregates_feedbackAggregate from "../tables/feedbacks/aggregates/feedbackAggregate.js";
import type * as tables_feedbacks_helpers_getFeedbackPage from "../tables/feedbacks/helpers/getFeedbackPage.js";
import type * as tables_feedbacks_helpers_readFeedbackFilters from "../tables/feedbacks/helpers/readFeedbackFilters.js";
import type * as tables_feedbacks_mutations_createFeedback from "../tables/feedbacks/mutations/createFeedback.js";
import type * as tables_feedbacks_mutations_updateFeedbackStatus from "../tables/feedbacks/mutations/updateFeedbackStatus.js";
import type * as tables_feedbacks_queries_fetchFeedbacksAdmin from "../tables/feedbacks/queries/fetchFeedbacksAdmin.js";
import type * as tables_feedbacks_validators_feedbackValidators from "../tables/feedbacks/validators/feedbackValidators.js";
import type * as tables_newsletters_aggregates_newsletterAggregate from "../tables/newsletters/aggregates/newsletterAggregate.js";
import type * as tables_newsletters_helpers_getNewsletterPage from "../tables/newsletters/helpers/getNewsletterPage.js";
import type * as tables_newsletters_mutations_subscribeToNewsletter from "../tables/newsletters/mutations/subscribeToNewsletter.js";
import type * as tables_newsletters_mutations_upsertNewsletterSubscriber from "../tables/newsletters/mutations/upsertNewsletterSubscriber.js";
import type * as tables_newsletters_queries_fetchNewslettersAdmin from "../tables/newsletters/queries/fetchNewslettersAdmin.js";
import type * as tables_newsletters_validators_newsletterValidators from "../tables/newsletters/validators/newsletterValidators.js";
import type * as tables_reviews_aggregates_reviewAggregate from "../tables/reviews/aggregates/reviewAggregate.js";
import type * as tables_reviews_helpers_enrichMyReview from "../tables/reviews/helpers/enrichMyReview.js";
import type * as tables_reviews_helpers_getAccommodationReviewSummaries from "../tables/reviews/helpers/getAccommodationReviewSummaries.js";
import type * as tables_reviews_helpers_getAccommodationReviewSummary from "../tables/reviews/helpers/getAccommodationReviewSummary.js";
import type * as tables_reviews_helpers_getReviewPage from "../tables/reviews/helpers/getReviewPage.js";
import type * as tables_reviews_mutations_createReview from "../tables/reviews/mutations/createReview.js";
import type * as tables_reviews_mutations_updateReviewVisibility from "../tables/reviews/mutations/updateReviewVisibility.js";
import type * as tables_reviews_queries_fetchAccommodationReviews from "../tables/reviews/queries/fetchAccommodationReviews.js";
import type * as tables_reviews_queries_fetchBookingReview from "../tables/reviews/queries/fetchBookingReview.js";
import type * as tables_reviews_queries_fetchEligibleReviewBookings from "../tables/reviews/queries/fetchEligibleReviewBookings.js";
import type * as tables_reviews_queries_fetchMyReview from "../tables/reviews/queries/fetchMyReview.js";
import type * as tables_reviews_queries_fetchMyReviews from "../tables/reviews/queries/fetchMyReviews.js";
import type * as tables_reviews_queries_fetchReviewsAdmin from "../tables/reviews/queries/fetchReviewsAdmin.js";
import type * as tables_reviews_validators_reviewValidators from "../tables/reviews/validators/reviewValidators.js";
import type * as turnstile_verifyTurnstile from "../turnstile/verifyTurnstile.js";
import type * as utils_cursorPagination from "../utils/cursorPagination.js";
import type * as utils_getTranslationLocale from "../utils/getTranslationLocale.js";
import type * as validators_listPageArgs from "../validators/listPageArgs.js";
import type * as validators_pageValidator from "../validators/pageValidator.js";
import type * as wrappers_fetchOptimizedSearchQuery from "../wrappers/fetchOptimizedSearchQuery.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "aggregates/helpers/getFilteredTotalAggregate": typeof aggregates_helpers_getFilteredTotalAggregate;
  "aggregates/helpers/getTotalSizeAggregate": typeof aggregates_helpers_getTotalSizeAggregate;
  "aggregates/utils/getPrefixRangeBoundsAggregate": typeof aggregates_utils_getPrefixRangeBoundsAggregate;
  "auditLogs/helpers/logAuditBulk": typeof auditLogs_helpers_logAuditBulk;
  "auditLogs/helpers/logAuditChange": typeof auditLogs_helpers_logAuditChange;
  "auditLogs/helpers/logAuditEvent": typeof auditLogs_helpers_logAuditEvent;
  "auditLogs/mutations/cleanupAuditLogs": typeof auditLogs_mutations_cleanupAuditLogs;
  "auditLogs/mutations/writeAuditBulk": typeof auditLogs_mutations_writeAuditBulk;
  "auditLogs/mutations/writeAuditChange": typeof auditLogs_mutations_writeAuditChange;
  "auditLogs/mutations/writeAuditEvent": typeof auditLogs_mutations_writeAuditEvent;
  "auditLogs/queries/fetchAuditLogsAdmin": typeof auditLogs_queries_fetchAuditLogsAdmin;
  "auditLogs/types/auditLogsTypes": typeof auditLogs_types_auditLogsTypes;
  auth: typeof auth;
  "betterAuth/auth": typeof betterAuth_auth;
  "betterAuth/cleanupDeletedUserData": typeof betterAuth_cleanupDeletedUserData;
  "betterAuth/config": typeof betterAuth_config;
  "betterAuth/emails/sendDeleteAccountVerificationEmail": typeof betterAuth_emails_sendDeleteAccountVerificationEmail;
  "betterAuth/emails/sendVerificationOTPEmail": typeof betterAuth_emails_sendVerificationOTPEmail;
  "betterAuth/helpers/checkAccountDeletionRestrictions": typeof betterAuth_helpers_checkAccountDeletionRestrictions;
  "betterAuth/helpers/requireIdentity": typeof betterAuth_helpers_requireIdentity;
  "betterAuth/helpers/sendOtpEmail": typeof betterAuth_helpers_sendOtpEmail;
  "betterAuth/queries/checkAccountDeletion": typeof betterAuth_queries_checkAccountDeletion;
  "betterAuth/tables/users/aggregates/userTotalAggregate": typeof betterAuth_tables_users_aggregates_userTotalAggregate;
  "betterAuth/tables/users/helpers/filterPredicates": typeof betterAuth_tables_users_helpers_filterPredicates;
  "betterAuth/tables/users/migrations/backfillUserTotal": typeof betterAuth_tables_users_migrations_backfillUserTotal;
  "betterAuth/tables/users/queries/fetchUserBreadcrumbAdmin": typeof betterAuth_tables_users_queries_fetchUserBreadcrumbAdmin;
  "betterAuth/tables/users/queries/fetchUserLogsAdmin": typeof betterAuth_tables_users_queries_fetchUserLogsAdmin;
  "betterAuth/tables/users/queries/fetchUserProfileAdmin": typeof betterAuth_tables_users_queries_fetchUserProfileAdmin;
  "betterAuth/tables/users/queries/fetchUserSessionsAdmin": typeof betterAuth_tables_users_queries_fetchUserSessionsAdmin;
  "betterAuth/tables/users/queries/fetchUserSettingsAdmin": typeof betterAuth_tables_users_queries_fetchUserSettingsAdmin;
  "betterAuth/tables/users/queries/fetchUsersAdmin": typeof betterAuth_tables_users_queries_fetchUsersAdmin;
  "builders/convexFunctionBuilders": typeof builders_convexFunctionBuilders;
  "contact/mutations/sendContactForm": typeof contact_mutations_sendContactForm;
  crons: typeof crons;
  "emails/data/emailData": typeof emails_data_emailData;
  "emails/sendEmail": typeof emails_sendEmail;
  "emails/templates/footerTemplate": typeof emails_templates_footerTemplate;
  "emails/templates/headerTemplate": typeof emails_templates_headerTemplate;
  "emails/translations/sendBookingCancellationEmailTranslation": typeof emails_translations_sendBookingCancellationEmailTranslation;
  "emails/translations/sendBookingConfirmationEmailTranslation": typeof emails_translations_sendBookingConfirmationEmailTranslation;
  "emails/translations/sendBookingExpirationEmailTranslation": typeof emails_translations_sendBookingExpirationEmailTranslation;
  "emails/translations/sendBookingRecoveryEmailTranslation": typeof emails_translations_sendBookingRecoveryEmailTranslation;
  "emails/translations/sendBookingRequestEmailTranslation": typeof emails_translations_sendBookingRequestEmailTranslation;
  "emails/types/emailTypes": typeof emails_types_emailTypes;
  "helpers/getPagination": typeof helpers_getPagination;
  "helpers/paginateSearch": typeof helpers_paginateSearch;
  http: typeof http;
  "migrations/backfillAccommodationCancellationPolicies": typeof migrations_backfillAccommodationCancellationPolicies;
  "migrations/backfillAccommodationRecommendationScores": typeof migrations_backfillAccommodationRecommendationScores;
  "migrations/backfillAccommodationTimeZones": typeof migrations_backfillAccommodationTimeZones;
  "migrations/backfillBookingEmails": typeof migrations_backfillBookingEmails;
  "migrations/backfillBookingTiming": typeof migrations_backfillBookingTiming;
  "migrations/backfillOwnerIds": typeof migrations_backfillOwnerIds;
  "migrations/migrations": typeof migrations_migrations;
  "migrations/removeBookingEmailRetryState": typeof migrations_removeBookingEmailRetryState;
  "migrations/types/migrationTypes": typeof migrations_types_migrationTypes;
  "rateLimits/bookingRecoveryRateLimits": typeof rateLimits_bookingRecoveryRateLimits;
  "rateLimits/helpers/enforceRateLimit": typeof rateLimits_helpers_enforceRateLimit;
  "rateLimits/types/rateLimitTypes": typeof rateLimits_types_rateLimitTypes;
  "search/queries/fetchSearchSuggestions": typeof search_queries_fetchSearchSuggestions;
  seed: typeof seed;
  "sorting/calculateRecommendationScore": typeof sorting_calculateRecommendationScore;
  "storage/actions": typeof storage_actions;
  "storage/getUploadByKey": typeof storage_getUploadByKey;
  "storage/r2": typeof storage_r2;
  "tables/accommodations/aggregates/accommodationOwnerAggregate": typeof tables_accommodations_aggregates_accommodationOwnerAggregate;
  "tables/accommodations/helpers/buildAccommodationSearchQuery": typeof tables_accommodations_helpers_buildAccommodationSearchQuery;
  "tables/accommodations/helpers/getAccommodationsByGuestRatingSort": typeof tables_accommodations_helpers_getAccommodationsByGuestRatingSort;
  "tables/accommodations/helpers/getAccommodationsByPriceSort": typeof tables_accommodations_helpers_getAccommodationsByPriceSort;
  "tables/accommodations/helpers/getAccommodationsByRecommendedSort": typeof tables_accommodations_helpers_getAccommodationsByRecommendedSort;
  "tables/accommodations/helpers/getMyAccommodationPage": typeof tables_accommodations_helpers_getMyAccommodationPage;
  "tables/accommodations/helpers/readAccommodationFilters": typeof tables_accommodations_helpers_readAccommodationFilters;
  "tables/accommodations/helpers/updateAccommodationReviewSortKeys": typeof tables_accommodations_helpers_updateAccommodationReviewSortKeys;
  "tables/accommodations/mutations/createAccommodation": typeof tables_accommodations_mutations_createAccommodation;
  "tables/accommodations/mutations/updateAccommodation": typeof tables_accommodations_mutations_updateAccommodation;
  "tables/accommodations/queries/fetchAccommodationsMapSearch": typeof tables_accommodations_queries_fetchAccommodationsMapSearch;
  "tables/accommodations/queries/fetchAccommodationsSearch": typeof tables_accommodations_queries_fetchAccommodationsSearch;
  "tables/accommodations/queries/fetchMyAccommodation": typeof tables_accommodations_queries_fetchMyAccommodation;
  "tables/accommodations/queries/fetchMyAccommodationListing": typeof tables_accommodations_queries_fetchMyAccommodationListing;
  "tables/accommodations/queries/fetchMyAccommodations": typeof tables_accommodations_queries_fetchMyAccommodations;
  "tables/accommodations/queries/fetchPublicAccommodation": typeof tables_accommodations_queries_fetchPublicAccommodation;
  "tables/accommodations/utils/resolveImageUrls": typeof tables_accommodations_utils_resolveImageUrls;
  "tables/accommodations/validators/accommodationValidators": typeof tables_accommodations_validators_accommodationValidators;
  "tables/bookingRecoveryTokens/actions/deliverBookingRecoveryLink": typeof tables_bookingRecoveryTokens_actions_deliverBookingRecoveryLink;
  "tables/bookingRecoveryTokens/actions/issueBookingRecoveryToken": typeof tables_bookingRecoveryTokens_actions_issueBookingRecoveryToken;
  "tables/bookingRecoveryTokens/actions/requestBookingRecoveryLink": typeof tables_bookingRecoveryTokens_actions_requestBookingRecoveryLink;
  "tables/bookingRecoveryTokens/crons/cleanupExpiredBookingRecoveryTokensCron": typeof tables_bookingRecoveryTokens_crons_cleanupExpiredBookingRecoveryTokensCron;
  "tables/bookingRecoveryTokens/emails/sendBookingRecoveryEmail": typeof tables_bookingRecoveryTokens_emails_sendBookingRecoveryEmail;
  "tables/bookingRecoveryTokens/helpers/getBookingRecoveryToken": typeof tables_bookingRecoveryTokens_helpers_getBookingRecoveryToken;
  "tables/bookingRecoveryTokens/mutations/storeBookingRecoveryToken": typeof tables_bookingRecoveryTokens_mutations_storeBookingRecoveryToken;
  "tables/bookingRecoveryTokens/ratelimiting/bookingRecoveryTokenRateLimits": typeof tables_bookingRecoveryTokens_ratelimiting_bookingRecoveryTokenRateLimits;
  "tables/bookingRecoveryTokens/validators/bookingRecoveryTokenValidators": typeof tables_bookingRecoveryTokens_validators_bookingRecoveryTokenValidators;
  "tables/bookings/aggregates/bookingOwnerAggregate": typeof tables_bookings_aggregates_bookingOwnerAggregate;
  "tables/bookings/crons/expireBookingRequestsCron": typeof tables_bookings_crons_expireBookingRequestsCron;
  "tables/bookings/emails/sendBookingCancellationEmail": typeof tables_bookings_emails_sendBookingCancellationEmail;
  "tables/bookings/emails/sendBookingConfirmationEmail": typeof tables_bookings_emails_sendBookingConfirmationEmail;
  "tables/bookings/emails/sendBookingExpirationEmail": typeof tables_bookings_emails_sendBookingExpirationEmail;
  "tables/bookings/emails/sendBookingRequestEmail": typeof tables_bookings_emails_sendBookingRequestEmail;
  "tables/bookings/helpers/completeBooking": typeof tables_bookings_helpers_completeBooking;
  "tables/bookings/helpers/enrichBookingPage": typeof tables_bookings_helpers_enrichBookingPage;
  "tables/bookings/helpers/getBookingGuestDetails": typeof tables_bookings_helpers_getBookingGuestDetails;
  "tables/bookings/helpers/getBookingToClaim": typeof tables_bookings_helpers_getBookingToClaim;
  "tables/bookings/helpers/getHostBookingPage": typeof tables_bookings_helpers_getHostBookingPage;
  "tables/bookings/helpers/readBookingFilters": typeof tables_bookings_helpers_readBookingFilters;
  "tables/bookings/mutations/cancelBooking": typeof tables_bookings_mutations_cancelBooking;
  "tables/bookings/mutations/claimBooking": typeof tables_bookings_mutations_claimBooking;
  "tables/bookings/mutations/completeBookingAdmin": typeof tables_bookings_mutations_completeBookingAdmin;
  "tables/bookings/mutations/createBooking": typeof tables_bookings_mutations_createBooking;
  "tables/bookings/mutations/enqueueBookingCancellationEmail": typeof tables_bookings_mutations_enqueueBookingCancellationEmail;
  "tables/bookings/mutations/updateBookingStatus": typeof tables_bookings_mutations_updateBookingStatus;
  "tables/bookings/queries/fetchBooking": typeof tables_bookings_queries_fetchBooking;
  "tables/bookings/queries/fetchBookingConfirmation": typeof tables_bookings_queries_fetchBookingConfirmation;
  "tables/bookings/queries/fetchBookingToClaim": typeof tables_bookings_queries_fetchBookingToClaim;
  "tables/bookings/queries/fetchHostBookings": typeof tables_bookings_queries_fetchHostBookings;
  "tables/bookings/queries/fetchMyBookings": typeof tables_bookings_queries_fetchMyBookings;
  "tables/bookings/queries/hasPendingHostBookings": typeof tables_bookings_queries_hasPendingHostBookings;
  "tables/bookings/validators/bookingValidators": typeof tables_bookings_validators_bookingValidators;
  "tables/favorites/helpers/enrichFavoritePage": typeof tables_favorites_helpers_enrichFavoritePage;
  "tables/favorites/helpers/getFavoriteIds": typeof tables_favorites_helpers_getFavoriteIds;
  "tables/favorites/mutations/updateFavoriteStatus": typeof tables_favorites_mutations_updateFavoriteStatus;
  "tables/favorites/queries/fetchFavorites": typeof tables_favorites_queries_fetchFavorites;
  "tables/feedbacks/aggregates/feedbackAggregate": typeof tables_feedbacks_aggregates_feedbackAggregate;
  "tables/feedbacks/helpers/getFeedbackPage": typeof tables_feedbacks_helpers_getFeedbackPage;
  "tables/feedbacks/helpers/readFeedbackFilters": typeof tables_feedbacks_helpers_readFeedbackFilters;
  "tables/feedbacks/mutations/createFeedback": typeof tables_feedbacks_mutations_createFeedback;
  "tables/feedbacks/mutations/updateFeedbackStatus": typeof tables_feedbacks_mutations_updateFeedbackStatus;
  "tables/feedbacks/queries/fetchFeedbacksAdmin": typeof tables_feedbacks_queries_fetchFeedbacksAdmin;
  "tables/feedbacks/validators/feedbackValidators": typeof tables_feedbacks_validators_feedbackValidators;
  "tables/newsletters/aggregates/newsletterAggregate": typeof tables_newsletters_aggregates_newsletterAggregate;
  "tables/newsletters/helpers/getNewsletterPage": typeof tables_newsletters_helpers_getNewsletterPage;
  "tables/newsletters/mutations/subscribeToNewsletter": typeof tables_newsletters_mutations_subscribeToNewsletter;
  "tables/newsletters/mutations/upsertNewsletterSubscriber": typeof tables_newsletters_mutations_upsertNewsletterSubscriber;
  "tables/newsletters/queries/fetchNewslettersAdmin": typeof tables_newsletters_queries_fetchNewslettersAdmin;
  "tables/newsletters/validators/newsletterValidators": typeof tables_newsletters_validators_newsletterValidators;
  "tables/reviews/aggregates/reviewAggregate": typeof tables_reviews_aggregates_reviewAggregate;
  "tables/reviews/helpers/enrichMyReview": typeof tables_reviews_helpers_enrichMyReview;
  "tables/reviews/helpers/getAccommodationReviewSummaries": typeof tables_reviews_helpers_getAccommodationReviewSummaries;
  "tables/reviews/helpers/getAccommodationReviewSummary": typeof tables_reviews_helpers_getAccommodationReviewSummary;
  "tables/reviews/helpers/getReviewPage": typeof tables_reviews_helpers_getReviewPage;
  "tables/reviews/mutations/createReview": typeof tables_reviews_mutations_createReview;
  "tables/reviews/mutations/updateReviewVisibility": typeof tables_reviews_mutations_updateReviewVisibility;
  "tables/reviews/queries/fetchAccommodationReviews": typeof tables_reviews_queries_fetchAccommodationReviews;
  "tables/reviews/queries/fetchBookingReview": typeof tables_reviews_queries_fetchBookingReview;
  "tables/reviews/queries/fetchEligibleReviewBookings": typeof tables_reviews_queries_fetchEligibleReviewBookings;
  "tables/reviews/queries/fetchMyReview": typeof tables_reviews_queries_fetchMyReview;
  "tables/reviews/queries/fetchMyReviews": typeof tables_reviews_queries_fetchMyReviews;
  "tables/reviews/queries/fetchReviewsAdmin": typeof tables_reviews_queries_fetchReviewsAdmin;
  "tables/reviews/validators/reviewValidators": typeof tables_reviews_validators_reviewValidators;
  "turnstile/verifyTurnstile": typeof turnstile_verifyTurnstile;
  "utils/cursorPagination": typeof utils_cursorPagination;
  "utils/getTranslationLocale": typeof utils_getTranslationLocale;
  "validators/listPageArgs": typeof validators_listPageArgs;
  "validators/pageValidator": typeof validators_pageValidator;
  "wrappers/fetchOptimizedSearchQuery": typeof wrappers_fetchOptimizedSearchQuery;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/component/_generated/component.js").ComponentApi<"betterAuth">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  accommodationOwnerAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"accommodationOwnerAggregate">;
  bookingOwnerAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"bookingOwnerAggregate">;
  userTotalAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"userTotalAggregate">;
  newslettersAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"newslettersAggregate">;
  feedbacksAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"feedbacksAggregate">;
  reviewsAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"reviewsAggregate">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  auditLog: import("convex-audit-log/_generated/component.js").ComponentApi<"auditLog">;
};
