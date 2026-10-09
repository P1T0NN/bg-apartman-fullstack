# BGAPARTMAN LOYALTY PROGRAM

**DIRECT BOOKINGS**

A loyalty program for guests who book directly and return to stay with us.

## PROGRAM GOAL

Increase direct bookings and reward returning guests.

## Who can become a member?

- Guests who reach a loyalty level through completed qualifying stays.
- The booking that reaches a threshold earns progress; benefits apply to bookings
  made after reaching that level, never retroactively to the qualifying booking.

## Confirmed program rules

- Cash and card payments are equally eligible; cash is not a requirement.
- Membership lasts forever and cannot expire or be lost through inactivity.
- Level 1 unlocks after 2 completed qualifying stays, Level 2 after 5, and Level 3 after 8.
- Apply the better single property or loyalty discount, never add percentages.
  Equal discounts apply once; the guest keeps the level's available services.
- Count stays from loyalty launch onward; do not award historical stay credit.
- Only selected accommodations participate. Only admins may enable or disable
  an accommodation's required `loyaltyEligible` flag; false means ineligible.
- Only finished stays earn progress, one credit per booking regardless of nights
  or guests. Repeated bookings at the same property each count separately.
- The system awards progress automatically, without host/admin eligibility or
  payment confirmation. Selecting cash or card does not affect qualification.
- Participation is separate from service commitments: parking, breakfast and spa
  are offered only where explicitly provided by the accommodation.

## Levels and benefits

| LEVEL   | CRITERIA                     | BENEFITS                                                                                             |
| ------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| LEVEL 1 | Unlocks at 2 completed stays | 10% discount<br>Free parking                                                                         |
| LEVEL 2 | Unlocks at 5 completed stays | 15% discount<br>Free breakfast for up to 2 people<br>All Level 1 benefits                            |
| LEVEL 3 | Unlocks at 8 completed stays | 20% discount<br>Free breakfast for all guests<br>Free spa access<br>All Level 1 and Level 2 benefits |

> **Note:** Higher levels include all benefits from the previous levels.

---

BGAPARTMAN | LOYALTY PROGRAM

### Implementation rules

- Confirmed bookings finish automatically after the frozen property-local checkout
  time. A cron processes bounded batches every minute; hosts/admins do not need
  to mark stays completed for loyalty. Cancelled, pending, declined and expired
  bookings do not earn credit.
- A booking freezes participation in required `loyaltyStatus`: pending for a
  participating property, ineligible otherwise. Credited records prevent duplicate
  awards under retries or concurrent cron/manual completion. Later property edits
  never revoke earned credit or change an accepted booking's rewards.
- Anonymous bookings retain pending credit until the guest securely links the
  completed booking to an account. A credit can never be claimed by two accounts.
- Required membership levels follow lifetime totals at 2/5/8. Progress can exist
  before membership: `joinedAt` is null until Level 1 unlocks, then remains fixed.
- Existing bookings were backfilled to ineligible (394 development records), with
  no historical credit. New bookings snapshot participation when created.
- Admins control participation and commitments to parking, breakfast and spa.
  Missing service commitments grant no services; discounts still apply at enabled
  properties. Guest prices use the better single discount, including equal-rate
  ties, and keep all available services for the guest's level.

### RESEARCH

The recommendations below supplement the original program description. They are
proposals for implementation and presentation, not changes to the agreed program
rules. The program rules above are approved; the research below explains presentation choices.

#### Research and its practical implications

- A loyalty-program study found that participants increased their activity as
  they approached a reward. This supports making the next milestone and remaining
  qualifying stays visible. It does not establish that a particular page layout
  will increase accommodation bookings. Use truthful progress and validate the
  result with our guests. [Kivetz, Urminsky and Zheng, goal-gradient research](https://business.columbia.edu/faculty/research/goal-gradient-hypothesis-resurrected-purchase-acceleration-illusionary-goal)
- The recognition-over-recall usability principle supports showing concrete
  benefits where guests need them, rather than requiring guests to remember what
  a level includes. Display the actual discount and applicable perks on the
  benefits page and during booking. [Nielsen Norman Group, recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/)

The page structure below is a product recommendation informed by these findings;
research does not prescribe this exact route, layout, or tier thresholds.

#### Guest benefits page

Create a protected `/guest/benefits` page with **My benefits** in the guest
navigation. Present its content in this order:

1. **Current level and available benefits.** For example, show "Level 1", "10%
   loyalty discount", and "Free parking". Explain property participation and
   conditions wherever they affect availability.
2. **Progress toward the next level.** Show completed qualifying stays, a simple
   progress bar, and the exact number remaining. For example: "Complete 1 more
   qualifying stay to unlock 15% off and breakfast for two." Progress must use the
   confirmed thresholds. At Level 3, display "Highest level reached" instead of
   suggesting a further reward.
3. **A booking action.** Use "Find a stay", or "Find stays with your benefits" if
   only participating properties offer the program.
4. **Comparison of all levels.** Use a compact table on desktop and stacked
   sections on mobile. Mark "Your level" and "Next level". List each level's
   complete benefits so guests do not have to combine multiple lists. Higher
   discount percentages replace the lower percentage, rather than adding to it.
5. **How the program works.** Explain qualifying bookings, when stays count,
   payment requirements, participating properties, expiration, and discount
   combination rules. Booking history belongs in My bookings; do not duplicate
   it on the benefits page.

Keep current benefits and the next milestone visually prominent. Include text
labels alongside progress and status colors so color alone never conveys a level
or eligibility. Ensure comparison content remains readable on mobile.

#### Benefits throughout the booking journey

- On accommodation details, show the benefits this guest can actually receive at
  this property. Never imply that every listing offers parking, breakfast or spa
  access when those services are unavailable.
- At checkout, show the applicable loyalty discount as a separate price line,
  the final price, and the included perks with their conditions.
- The benefits page explains membership; the accommodation and checkout pages
  confirm the offer for the specific booking.
- For guests with no qualifying stays, explain how to earn the first level and
  show the first milestone. Do not label benefits as available unless the
  confirmed first-booking policy grants them.

#### Public loyalty discovery

- Participating accommodation cards show an outlined star with a green "Loyalty
  rewards" label below the property name and rating. The label identifies
  participation; it does not promise an unearned discount.
- Cards calculate the signed-in guest's actual earned discount using the same
  quote helper as checkout. An applicable loyalty discount replaces the property
  percentage with a green "X% off · Loyalty" label and updates the nightly price.
  A larger property discount still wins; equal discounts apply once and are
  attributed to loyalty. Property discounts use a neutral label.
- Search price filters, ordering and map pin prices continue to use the public
  property rate, before personalized loyalty discounts.
- A compact, non-sticky loyalty announcement sits above the header on public
  browsing pages. It scrolls away while the existing header remains sticky.
  `HeaderAnnouncement` lives alongside `Header` in
  `src/components/ui/custom-components/header/header-announcement.svelte`;
  translations use `Components.HeaderAnnouncement`.
- "See the benefits" uses the localized homepage `#loyalty` anchor. It scrolls
  within the homepage and navigates to that section from other public pages.
- Account-access, booking checkout, confirmation, dashboard and admin pages do
  not show the announcement.
- The homepage section sits between the search hero and newsletter. It explains
  the first qualifying-stay milestone, all three levels, participating properties,
  service availability, future-booking benefits and non-stacking discounts.
- Thresholds and discount percentages come from shared `LOYALTY_LEVELS` data.
  `LOYALTY_CONFIG.BOOKING_ENABLED` controls public promotion visibility. The section
  has a scroll offset so the sticky header does not obscure its heading.
- Public copy is discovery material, not a promise of benefits at every property
  or immediate membership. Booking-specific eligibility remains authoritative.

#### Decision status

| Decision               | Status                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Membership starts      | Confirmed: benefits apply to new bookings after unlocking a level.                                                                     |
| Level thresholds       | Confirmed: Level 1 at 2, Level 2 at 5, and Level 3 at 8 completed qualifying stays.                                                    |
| What earns progress    | Confirmed: one automatic credit per finished eligible booking, including repeat visits. No manual eligibility or payment confirmation. |
| Property participation | Confirmed: only accommodations enabled by admins. Services depend on explicit property commitments.                                    |
| Discount combination   | Confirmed: the better single discount; equal discounts apply once and preserve available loyalty services.                             |
| Membership expiration  | Confirmed: permanent membership, with no expiry or requalification.                                                                    |
| Payment eligibility    | Confirmed: cash and card qualify equally.                                                                                              |
| Historical credit      | Confirmed: count from loyalty launch onward, without historical stay credit.                                                           |

All business decisions are confirmed. Automatic credits and live rewards are enabled.
