# BGAPARTMAN LOYALTY PROGRAM

**DIRECT BOOKINGS**

A loyalty program for guests who book directly and return to stay with us.

## PROGRAM GOAL

Increase direct bookings and reward returning guests.

## Who can become a member?

- Guests who have stayed with us at least once.
- Guests who make a direct booking with us in advance and pay in cash.

## Levels and benefits

| LEVEL   | CRITERIA      | BENEFITS                                                                                             |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| LEVEL 1 | Up to 2 stays | 10% discount<br>Free parking                                                                         |
| LEVEL 2 | Up to 5 stays | 15% discount<br>Free breakfast for up to 2 people<br>All Level 1 benefits                            |
| LEVEL 3 | 5+ stays      | 20% discount<br>Free breakfast for all guests<br>Free spa access<br>All Level 1 and Level 2 benefits |

> **Note:** Higher levels include all benefits from the previous levels.

---

BGAPARTMAN | LOYALTY PROGRAM

### RESEARCH

The recommendations below supplement the original program description. They are
proposals for implementation and presentation, not changes to the agreed program
rules. Resolve the open business decisions before implementing eligibility or
promising benefits to guests.

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
   combination rules. Add a small qualifying-stay history when guests need to
   verify their progress.

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

#### Business decisions to resolve before implementation

| Decision                  | Recommendation or clarification needed                                                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overlapping thresholds    | The original "up to 5 stays" and "5+ stays" overlap at five. Proposed ranges: Level 1 at 1-2 completed qualifying stays, Level 2 at 3-4, and Level 3 at 5+. These ranges need approval and do not replace the original table. |
| What earns progress       | Count each completed qualifying booking once. Exclude cancelled bookings and no-shows. State clearly that progress counts stays, not nights or guests.                                                                        |
| First-booking eligibility | Decide whether an advance direct booking grants Level 1 immediately, or whether the first qualifying stay must be completed. The current membership criteria leave this unclear.                                              |
| Property participation    | Decide whether the program covers all accommodations or only participating properties. Promise each perk only where the property offers it.                                                                                   |
| Discount combination      | Higher loyalty percentages replace lower ones. Define how loyalty discounts interact with the existing accommodation discount and which price they apply to.                                                                  |
| Progress expiration       | Start with lifetime progress unless there is a business reason for annual qualification. Publish any expiry or requalification rules explicitly.                                                                              |
| Cash eligibility          | Confirm whether cash payment is mandatory, define what counts as a direct booking, and decide whether the host must verify payment before awarding stay credit.                                                               |

These policy choices are product recommendations and open decisions, not findings
established by the cited research. Do not infer that an existing confirmed booking
or selected cash payment method proves a completed, paid qualifying stay.
