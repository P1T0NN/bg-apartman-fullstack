# Booking page design

## Recommended layout

A single page: trip details, lead guest details, then review. Keep the property photo small. On desktop, put the price summary to the right and keep it visible while scrolling. On mobile, show the estimate before the form. Labels remain above controls; optional special requests expand on demand.

Search dates and guest counts carry into the form. Guests can correct every field in place. The review action validates the form, retains input and focuses either the first invalid field or the review heading. Registration does not interrupt the flow.

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

A guest booking request can be submitted through `createBooking`, which re-validates the stay against the listing (dates, stay limits and capacity) and stores the guest contact details. There is still no availability calendar, complete fee quote, discount policy, cancellation policy, payment or host claim/confirmation flow, so no dates are held and no money is taken. The UI therefore labels its calculation **Accommodation estimate** and does not invent a discount or all-inclusive total.

Before treating a request as a confirmed reservation, connect a server-generated quote and an atomic availability/reservation operation. Use the intended payment model to choose an exact final action such as “Reserve, pay at property”, “Pay €290 and reserve”, or “Send booking request”. The server must validate the stay and final amount again; the client estimate is not authoritative.

## Evaluation

Measure successful reservations alongside form errors, abandonment, cancellations and price-related support requests. Compare actual completion rates with an A/B test after the reservation flow works. Conversion alone cannot establish that guests understood what they booked.
