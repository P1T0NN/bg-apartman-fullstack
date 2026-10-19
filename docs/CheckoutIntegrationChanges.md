# Checkout.com change inventory

This lists the assistant's Checkout.com integration work in the previous turn and
the file-splitting refactor in the current turn. The workspace already contained
other edits and Stripe removals; those are not attributed to this integration.

## Feature, integration, and test files

| File                                                                                                                        | Previous turn                                         | Current turn                                                                   |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `.convex.example.env`                                                                                                       | Added sandbox environment examples                    | Unchanged                                                                      |
| `TODO.md`                                                                                                                   | Updated payment implementation status                 | Unchanged                                                                      |
| `docs/AccommodationBillingSystemDesign.md`                                                                                  | Documented sandbox checkout and setup                 | Documented the split modules                                                   |
| `docs/ProjectCodingRules.md`                                                                                                | Updated the payment domain map                        | Documented schema/config/helper ownership                                      |
| `docs/CheckoutIntegrationChanges.md`                                                                                        | Not present                                           | Added this requested inventory                                                 |
| `messages/en.json`                                                                                                          | Added the pending-checkout error message              | Unchanged                                                                      |
| `src/convex/convex.config.ts`                                                                                               | Declared typed Checkout environment variables         | Unchanged                                                                      |
| `src/convex/crons.ts`                                                                                                       | Registered payment reconciliation                     | Read the interval from shared payment config                                   |
| `src/convex/http.ts`                                                                                                        | Registered `/checkout-webhook`                        | Updated the handler import                                                     |
| `src/convex/schema.ts`                                                                                                      | Registered webhook event storage                      | Unchanged                                                                      |
| `src/convex/checkout/actions/reconcileFeeCheckout.ts`                                                                       | Added scheduled reconciliation action                 | Unchanged                                                                      |
| `src/convex/checkout/crons/maintainFeePayments.ts`                                                                          | Added bounded retry and event cleanup                 | Read batch sizes and timing from feature config                                |
| `src/convex/checkout/helpers/checkoutApi.ts`                                                                                | Added combined schemas/config/request code            | Removed after splitting its responsibilities                                   |
| `src/convex/checkout/helpers/reconcileFeePayment.ts`                                                                        | Added payment verification and fulfillment            | Updated schema imports and extracted refund handling                           |
| `src/convex/checkout/mutations/queueWebhook.ts`                                                                             | Added event deduplication and scheduling              | Read retention and timing from feature config                                  |
| `src/convex/checkout/webhook.ts`                                                                                            | Added webhook handler and signature verification      | Replaced by the handler and utility below                                      |
| `src/convex/checkout/checkoutWebhook.ts`                                                                                    | Not present                                           | Moved the HTTP handler here                                                    |
| `src/convex/checkout/errors/CheckoutApiError.ts`                                                                            | Not present                                           | Extracted the HTTP status error class                                          |
| `src/convex/checkout/helpers/checkoutRequest.ts`                                                                            | Not present                                           | Extracted authenticated requests and response validation                       |
| `src/convex/checkout/helpers/getCheckoutConfig.ts`                                                                          | Not present                                           | Extracted secret environment reads and sandbox checks                          |
| `src/convex/checkout/helpers/reconcileFeeRefund.ts`                                                                         | Not present                                           | Extracted refund requests and status verification                              |
| `src/convex/checkout/utils/verifyCheckoutSignature.ts`                                                                      | Not present                                           | Extracted raw-body HMAC verification                                           |
| `src/convex/tables/accommodationFeePayments/actions/createFeeCheckout.ts`                                                   | Recreated with Checkout.com checkout logic            | Updated imports and sandbox country config                                     |
| `src/convex/tables/accommodationFeePayments/actions/refreshFeePayment.ts`                                                   | Recreated with Checkout.com verification              | Unchanged                                                                      |
| `src/convex/tables/accommodationFeePayments/mutations/applyFeeCheckout.ts`                                                  | Preserved retries for unresolved payments/refunds     | Read retry timing from shared payment config                                   |
| `src/convex/tables/accommodationFeePayments/mutations/claimFeeCheckout.ts`                                                  | Added creation claim to prevent duplicate sessions    | Read retry timing from shared payment config                                   |
| `src/convex/tables/accommodationFeePayments/mutations/saveFeeCheckout.ts`                                                   | Scheduled checkout verification                       | Read retry timing from shared payment config                                   |
| `src/convex/tables/accommodationFeePayments/mutations/saveFeeReconciliation.ts`                                             | Added retry/failed-creation state updates             | Read retry timing from shared payment config                                   |
| `src/convex/tables/accommodationFeePayments/schema.ts`                                                                      | Added creation timestamp and provider/retry index     | Unchanged                                                                      |
| `src/convex/tables/checkoutWebhookEvents/schema.ts`                                                                         | Added deduplication event table and indexes           | Unchanged                                                                      |
| `src/features/accommodations/components/accommodation-flat-fee-payment-button/accommodation-flat-fee-payment-button.svelte` | Connected Pay Now, pending state, redirect and errors | Unchanged                                                                      |
| `src/features/payments/components/accommodation-fee-payment-history/accommodation-fee-payment-history.svelte`               | Connected return-page status refresh                  | Unchanged                                                                      |
| `src/routes/(app)/(protected)/host/accommodation-payment-successful/+page.svelte`                                           | Connected automatic/manual status verification        | Unchanged                                                                      |
| `src/shared/features/checkout/schemas/checkoutSchemas.ts`                                                                   | Not present                                           | Populated the empty file created by the user with response and webhook schemas |
| `src/shared/features/checkout/config.ts`                                                                                    | Not present                                           | Extracted non-secret Checkout settings                                         |
| `src/shared/features/checkout/utils/validateCheckoutUrl.ts`                                                                 | Not present                                           | Extracted sandbox redirect validation                                          |
| `src/shared/features/payments/config.ts`                                                                                    | Unchanged                                             | Added the existing reconciliation interval as shared config                    |
| `src/shared/types/types.ts`                                                                                                 | Added the structured pending-checkout error           | Unchanged                                                                      |
| `src/utils/getBackendErrorMessage.ts`                                                                                       | Mapped that error to its translated message           | Unchanged                                                                      |
| `tests/convex/accommodationFeePayments.test.ts`                                                                             | Added Checkout.com integration and security tests     | Updated imports to the split modules                                           |

## Generated files

| File                                                                | Previous turn                                | Current turn                                       |
| ------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| `src/convex/_generated/api.d.ts`                                    | Regenerated local function/module references | Regenerated references for moved and added modules |
| `src/convex/_generated/server.d.ts`                                 | Generated the typed environment declarations | Unchanged                                          |
| `src/lib/paraglide/messages/_index.js`                              | Regenerated translation exports              | Unchanged                                          |
| `src/lib/paraglide/messages/backendmessages_feecheckoutpending4.js` | Generated the pending-checkout translation   | Unchanged                                          |

Convex API types were initially generated locally with the installed SDK templates
while project access was unavailable. On 2026-10-13 the CLI regenerated them during
the successful development deployment. The Paraglide files are ignored compiler
output.

## Formatting-only writes in the previous turn

The required repository-wide `bun run format` also rewrote formatting in the
following existing files. No intentional behavior changes were made to these
files as part of the Checkout integration:

- `DESIGN.json`
- `DESIGN.md`
- `src/components/pages/(protected)/guest/settings/guest-settings-tab-security/guest-settings-tab-security.svelte`
- `src/components/pages/(protected)/host/bookings/host-bookings-item-actions/host-bookings-archive-button.svelte`
- `src/components/pages/(unprotected)/accommodation/accommodation-navigation.svelte`
- `src/components/pages/(unprotected)/root/featured-accommodations-section/featured-accommodations-section.svelte`
- `src/convex/betterAuth/component/generatedSchema.ts`
- `src/convex/betterAuth/component/queries/fetchSessions.ts`
- `src/convex/betterAuth/component/queries/fetchUser.ts`
- `src/convex/betterAuth/component/queries/fetchUsers.ts`
- `src/convex/betterAuth/config.ts`
- `src/convex/betterAuth/helpers/getHostPayoutsEnabled.ts`
- `src/convex/tables/accommodations/mutations/createAccommodation.ts`
- `src/convex/tables/accommodations/queries/fetchMyAccommodation.ts`
- `src/convex/tables/accommodations/queries/fetchMyAccommodations.ts`
- `src/convex/tables/accommodations/queries/fetchMyAccommodationSettings.ts`
- `src/convex/tables/accommodations/utils/returnMyAccommodationBilling.ts`
- `src/convex/tables/accommodations/validators/accommodationValidators.ts`
- `src/convex/tables/bookings/mutations/archiveBooking.ts`
- `src/shared/features/auth/types/authTypes.ts`

The current formatting pass changed only files in the refactor listed above.

## What the validation code does

The Zod schemas validate the parts of Checkout.com's responses used by the
integration. Amounts must be nonnegative safe integers in minor currency units
(cents for EUR). Hosted-page and payment IDs must have the expected format.
Payment responses must include their reference, amount, currency and captured/refunded
balances. Action responses are bounded to 151 items. The webhook schema validates
the event envelope after its signature has been verified.

These schemas do not charge cards or grant listing access. The Convex actions
make authenticated API requests; reconciliation checks the stored fee against
the retrieved provider data before the existing billing mutations grant a period.

The refactor preserves sandbox behavior, signature verification, request timeouts,
duplicate-event handling and refund idempotency. Development deployment succeeded
on 2026-10-13 after removing legacy PayPal fields from the Better Auth user table.
Webhook registration and a complete end-to-end sandbox payment remain unverified.

## Development PayPal cleanup on 2026-10-13

- Added `src/convex/betterAuth/component/migrations/removeUserPaypalFields.ts`.
- Added `tests/convex/removeUserPaypalFields.test.ts` for field preservation,
  pagination and safe reruns.
- Updated `docs/ProjectCodingRules.md`, `TODO.md`, and this inventory.
- The Convex CLI refreshed `src/convex/_generated/api.d.ts`,
  `src/convex/_generated/server.d.ts`,
  `src/convex/betterAuth/component/_generated/api.ts`, and
  `src/convex/betterAuth/component/_generated/component.ts`.
- Temporarily widened `src/convex/betterAuth/component/schema.ts` for the cleanup,
  then restored its existing strict schema. One development user was migrated;
  all other user fields were verified unchanged, including `payoutsEnabled`.
