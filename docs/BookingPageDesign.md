# Booking page design

## Recommended layout

A single page: trip details, lead guest details, then review. Keep the property photo small. On desktop, put the price summary to the right and keep it visible while scrolling. On mobile, show the estimate before the form. Labels remain above controls; optional special requests expand on demand.

Search dates and guest counts carry into the form. Guests can correct every field in place. The review action validates the form, retains input and focuses either the first invalid field or the review heading. Registration does not interrupt the flow.

The booking action is available in the estimate summary and below the guest details. Both buttons call the same `handleBookAccommodation` function and share its loading state and instant/request wording. Checkout uses directly bound values without a generic Form component or an HTML form. The handler validates the shared booking schema with the property-local time at click time, shows inline errors, focuses the first invalid control and preserves guest browser identity. It retains a successful booking ID so a failed confirmation-page navigation can be retried without creating another booking. Special requests have an example placeholder and remain subject to host confirmation.

## Why these choices

- **Lower perceived effort:** familiar controls, autocomplete and a short form reduce the work guests anticipate. First and last name remain separate because the existing booking model requires them.
- **Cost certainty:** the total belongs next to the action, with an itemized explanation immediately above it. Never introduce fees only at the final step.
- **Control:** editable dates, a back link and a review stage make it clear that guests can correct mistakes before committing.
- **Risk clarity:** state the cancellation deadline, refund amount and payment timing beside the reservation button once those terms exist. A generic trust badge cannot replace this information.

These are design recommendations informed by usability research, not a guaranteed conversion uplift. Baymard recommends clear forward actions, fewer visible fields, guest checkout and explicit field labels in its [checkout guide](https://baymard.com/blog/checkout-flow-ux-optimization). Its [payment research](https://baymard.com/blog/payment-ux) emphasizes visible costs and warns that exposed coupon fields can send customers away to search for codes.

## Discounts

Only display an offer when the server confirms that it applies to the selected dates and guests. Apply eligible offers automatically. If coupon support is added, keep the input behind a small “Have a promo code?” disclosure.

Example layout for a **real** 10% offer, using illustrative amounts:

| Price breakdown          |   Amount |
| ------------------------ | -------: |
| €100 × 3 nights          |     €300 |
| Stay offer, 10%          |     −€30 |
| Mandatory fees and taxes |      €20 |
| **Total for 3 nights**   | **€290** |

Use one quiet success color for the saving. Include the offer's actual name and conditions. A genuine original price may be struck through alongside the discounted price, but the final total should be more prominent than the percentage. Show “Due today” and “Due at property” separately if both apply. Do not invent an original price, countdown, scarcity claim, review score or free cancellation promise.

## Current implementation boundary

A guest booking request can be submitted through `createBooking`, which re-validates the stay against the listing (dates, stay limits and capacity), freezes cancellation terms and property-local stay times, and queues guest/host receipts. Hosts can confirm or decline requests; confirmation queues a guest email. Unanswered requests expire after 24 elapsed hours, or at scheduled check-in if sooner. The five-minute `expireBookingRequestsCron` changes due pending requests to `expired` and atomically queues a guest notice; late host decisions and guest withdrawals are rejected at the exact deadline. Guests can find or claim their booking and withdraw pending requests or cancel confirmed stays under the frozen policy. See [the booking domain rules](./ProjectCodingRules.md#domain-rules) and [expiration design](./CancellationPolicySystemDesign.md#unanswered-request-expiration).

Accommodations now choose **Request booking** (the default, including older listings) or **Instant Booking**. Instant bookings start confirmed, notify guest and host, and have no pending response deadline. The host's current stored choice is authoritative; a stale checkout must refresh and review a changed method. Changing a listing never retroactively confirms earlier pending requests.

Confirmed inventory is protected by an indexed overlap check in the same transaction as instant creation or host confirmation. Pending requests do not reserve dates. Already confirmed dates reject new submissions; checkout-day arrivals are allowed and cancellations release dates. The check is bounded and fails closed if it cannot establish availability. External calendar synchronization, manual blocked dates, advance notice and preparation time are still absent. There is no complete fee quote, discount policy or payment collection, so the UI retains **Accommodation estimate** and states that payment arrangements and additional fees need host agreement.

## Booking method placement and host guidance

Hosts choose the method in **Booking & house rules** in both add and edit flows. It sits with stay expectations rather than becoming another wizard step. The review step repeats the selected method before publishing.

Guests see a text label on search/favorite listing cards (lightning for instant, clock for request), a compact label beside the accommodation's booking action, and the full explanation above checkout's trip form. The final action reads **Book instantly** or **Send booking request**. Checkout headings, success messages and confirmation screens agree with the actual lifecycle. Request copy explicitly states that acceptance is required and gives the response deadline; instant copy says confirmation happens immediately without host approval. Special requests still need host agreement.

The accommodation sidebar contains the nightly rate, stay limits, capacity, booking method, full-policy link and booking action. Arrival-today restrictions belong in the house rules below. Checkout shows only the live cancellation refund period and its deadline; its full-policy ButtonLink carries the current dates and guest counts to `?section=cancellation-policy#cancellation-policy` on the accommodation page. This applies [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) while keeping the terms affecting the current decision visible.

The accommodation's full cancellation section is static: relative hours/days before check-in, all refund periods and general policy explanations. It ignores date query parameters and shows no current refund highlight, exact dates or date-selection prompt. Checkout owns the live preview for the selected stay; policy links still retain trip parameters so guests can return to booking with their choices.

The checkout calendar legend explains selectable dates, arrival/departure, selected nights, outlined today and dates before the earliest permitted arrival. Color markers have text labels. It does not claim booked dates are available: the calendar has no inventory feed, and its hint explains that submission checks availability.

[Vrbo explains that Instant Booking automatically accepts requests and marks listings with a lightning icon](https://www.vrbo.com/en-gb/help/articles/What-is-Instant-Booking). [Airbnb describes immediate confirmation without host approval](https://www.airbnb.com/help/article/523) and [emphasizes keeping availability current](https://www.airbnb.com/help/article/447). Repeating plain confirmation timing beside the decision points is this project's UX decision, informed by those conventions.

This project's host note **strongly recommends Request booking** so hosts can verify availability and prepare before accepting a stay. It explains that instant confirmation can happen before a host sees the notification, creating arrival or preparation problems, and recommends enabling instant only when availability, notification monitoring and check-in readiness can be maintained. This is the project's operational preference, not a claim that the industry generally discourages Instant Booking. Both choices remain available.

## Evaluation

Measure successful reservations alongside form errors, abandonment, cancellations and price-related support requests. Compare actual completion rates with an A/B test after the reservation flow works. Conversion alone cannot establish that guests understood what they booked.
