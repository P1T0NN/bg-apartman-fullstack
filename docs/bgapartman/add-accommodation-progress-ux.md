# Add Accommodation Progress UX Specification

## Purpose

This document defines how progress should be displayed throughout the **Add Accommodation** flow on both desktop and mobile.

The goal is to make the onboarding process feel clear, manageable, and structured without making it feel longer than it actually is.

The progress UI should always answer three questions for the host:

1. **Where am I?**
2. **How much is left?**
3. **What comes next?**

The design should avoid generic progress indicators that show only a percentage or a row of numbered circles without context.

---

# Core Progress Model

The Add Accommodation process should be organized into **7 high-level sections**:

1. Property basics
2. Location
3. Amenities
4. Photos & description
5. Pricing & availability
6. Guest rules
7. Review & publish

These are **sections**, not individual screens.

A section can contain multiple smaller screens.

For example, the **Location** section may contain:

- Address entry
- Map confirmation
- Location privacy

All of those screens should still remain inside:

> **2 of 7 — Location**

Do not increase the overall step count for every small screen.

The purpose is to keep the process psychologically short and easy to understand.

---

# Recommended Progress Indicator

The primary progress indicator should contain:

- Current section position
- Current section name
- Visual progress bar

Example:

```text
3 of 7

Amenities

━━━━━━━━━━━━────────────
```

The section name is the most important part.

The numerical indicator gives context.

The progress bar gives a fast visual understanding of how much remains.

---

# Do Not Use Only “Step X of Y”

Avoid relying only on:

```text
Step 3 of 7
```

This tells the user how far they are, but it does not tell them what the current section is.

If used, it must always be accompanied by the section name.

Preferred:

```text
3 of 7
Amenities
━━━━━━━━━━━━────────────
```

This is slightly better than:

```text
Step 3 of 7
Amenities
```

because some sections contain multiple internal screens.

If the host presses Continue but remains inside the Amenities section, keeping:

```text
3 of 7
Amenities
```

still feels natural.

---

# Do Not Count Every Micro-Screen

Avoid progress systems like:

```text
Step 8 of 22
```

Even if there are technically 22 screens, exposing that number makes the onboarding process feel unnecessarily long.

The user should perceive the flow as seven clear sections, not dozens of tasks.

Internal screens can change without changing the high-level section indicator.

Example:

```text
2 of 7
Location
```

can be displayed on all of these:

- Enter address
- Confirm map location
- Choose location privacy

Only after Location is fully completed should the progress move to:

```text
3 of 7
Amenities
```

---

# Desktop Design

On desktop, use **two levels of navigation**:

1. A persistent left-side section navigator
2. A local progress indicator above the active form

The structure should feel similar to a workspace rather than a simple mobile wizard stretched onto a desktop screen.

## Desktop Layout

Recommended structure:

```text
┌────────────────────────┬──────────────────────────────────────────┐
│                        │                                          │
│ ✓ Property basics      │  3 of 7                                  │
│ ✓ Location             │  Amenities                               │
│ ● Amenities            │  ━━━━━━━━━━━────────────                 │
│   Photos & description │                                          │
│   Pricing              │  Main form content                       │
│   Guest rules          │                                          │
│   Review & publish     │                                          │
│                        │                                          │
└────────────────────────┴──────────────────────────────────────────┘
```

The left sidebar communicates the overall process.

The top progress indicator communicates the current section.

These two elements should work together.

---

# Desktop Sidebar States

The sidebar should visually distinguish three states.

## Completed Section

Completed sections should show a checkmark.

Example:

```text
✓ Property basics
✓ Location
```

Completed sections should be clickable.

The user should be able to return to them to review or edit previous information.

## Current Section

The current section should be visually emphasized.

Example:

```text
● Amenities
```

Use stronger text weight, a subtle background, an accent indicator, or another restrained visual treatment.

The current item should be immediately recognizable without being visually aggressive.

## Future Sections

Future sections should look quieter.

Example:

```text
Photos & description
Pricing & availability
Guest rules
Review & publish
```

They should not visually compete with the current section.

Depending on the product logic, future sections may either:

- remain non-clickable until earlier required information is complete, or
- be clickable once enough of the listing draft exists

The preferred experience is eventually flexible, but the first-time flow should still guide users forward.

---

# Desktop Sidebar Position

The section navigator should remain visible while the user completes the current form when practical.

It should not scroll away immediately on long forms.

The sidebar should feel stable and act as an anchor for the process.

Do not make it excessively wide.

The main form content should remain the visual focus.

---

# Desktop Main Content

At the top of the content area show:

```text
3 of 7
Amenities
━━━━━━━━━━━━────────────
```

Then display the current question or form group.

Example:

```text
What does your property offer?
```

The progress UI should remain visually secondary to the actual task.

It should guide the user, not dominate the page.

---

# Desktop Back and Continue Controls

At the bottom of each screen provide clear navigation.

Example:

```text
← Back                              Continue →
```

The Continue action should be visually stronger.

Back should remain visible but secondary.

If the user is still inside the same high-level section, pressing Continue should not change the section progress.

Example:

```text
3 of 7
Amenities
```

can remain the same across multiple Amenities screens.

---

# Mobile Design

Mobile should be simpler than desktop.

Do **not** recreate the desktop sidebar as a drawer or horizontal tab system.

The mobile interface should focus only on:

- Current position
- Current section
- Progress bar
- Current task
- Back / Continue controls

## Mobile Layout

Recommended structure:

```text
3 of 7
Amenities
━━━━━━━━━━━━────────────

What does your property offer?

[ form content ]

← Back

[ Continue ]
```

The progress indicator should appear near the top of the screen.

It should be visible immediately without taking too much vertical space.

---

# Mobile Progress Indicator

Use the same high-level section logic as desktop:

```text
3 of 7
Amenities
━━━━━━━━━━━━────────────
```

Do not use:

```text
Step 8 of 22
```

Do not display all seven section names horizontally.

Do not use tiny numbered circles that require users to remember what each number represents.

Mobile users need a compact, direct progress summary.

---

# Mobile Navigation

The primary Continue button should preferably remain easy to reach.

A sticky bottom action area can work well.

Example:

```text
┌─────────────────────────────────────┐
│ ← Back               [ Continue ]   │
└─────────────────────────────────────┘
```

On narrower devices, the Continue button can span most or all of the available width.

The mobile user should never need to scroll back to the top or bottom unnecessarily just to move forward.

---

# Mobile Section Overview

The complete seven-section overview does not need to be permanently visible on mobile.

If access to previous sections is needed, it can be provided through a lightweight secondary action such as:

```text
View setup progress
```

This can open a dedicated progress screen showing:

```text
✓ Property basics
✓ Location
● Amenities
  Photos & description
  Pricing & availability
  Guest rules
  Review & publish
```

This should be optional and should not clutter the normal form flow.

---

# Progress Bar Behavior

The progress bar should represent the **seven major sections**.

It should not animate dramatically for every small field or question.

Recommended behavior:

- Property basics = section 1 progress
- Location = section 2 progress
- Amenities = section 3 progress
- Photos & description = section 4 progress
- Pricing & availability = section 5 progress
- Guest rules = section 6 progress
- Review & publish = section 7 progress

The bar should advance only when the host enters a new high-level section.

---

# Completed Section Behavior

When a section is completed:

- Mark it with a checkmark
- Save the data
- Allow the host to return later
- Preserve all entered information
- Keep the overall progress state accurate

If the host edits a completed section later, it should remain marked complete unless they remove required information.

If required information becomes invalid or missing, the section can change to an incomplete or warning state.

Example:

```text
⚠ Photos & description
```

Use warning states sparingly and only when action is required.

---

# Review & Publish State

The final section should be:

```text
7 of 7
Review & publish
━━━━━━━━━━━━━━━━━━━━
```

The review screen should summarize all important listing sections.

Example:

```text
Property basics            ✓ Complete
Location                   ✓ Complete
Amenities                  ✓ Complete
Photos & description       ✓ Complete
Pricing & availability     ✓ Complete
Guest rules                ✓ Complete
```

If anything required is missing, surface it clearly.

Example:

```text
Photos & description       ⚠ 1 item required
```

The user should be able to click or tap the section and return directly to it.

---

# Visual Hierarchy

The hierarchy should be:

1. Current task/question
2. Section name
3. Progress information
4. Navigation controls

The progress component should never visually overpower the form itself.

Avoid oversized progress bars, giant numerals, or decorative step indicators.

Keep it calm and functional.

---

# Recommended Wording

Use:

```text
3 of 7
Amenities
```

Prefer this over:

```text
Step 3 of 7
```

because the seven items are sections and may contain multiple internal screens.

The wording should remain consistent throughout the flow.

---

# Avoid These Patterns

Do not use only numbered circles:

```text
● ─ ● ─ ● ─ ● ─ ● ─ ● ─ ●
1   2   3   4   5   6   7
```

This does not explain what the numbers mean.

Do not use only percentages:

```text
43% complete
```

This is less meaningful than showing the current section.

Do not show every micro-screen as a separate step:

```text
Step 12 of 24
```

This makes the process feel much longer.

Do not show the full desktop sidebar on mobile.

Do not make future sections visually dominant.

Do not prevent users from returning to completed sections.

---

# Final Desktop Recommendation

Desktop should look conceptually like:

```text
┌────────────────────────┬──────────────────────────────────────────┐
│ ✓ Property basics      │  3 of 7                                  │
│ ✓ Location             │  Amenities                               │
│ ● Amenities            │  ━━━━━━━━━━━────────────                 │
│   Photos & description │                                          │
│   Pricing & availability│  Current form/question                  │
│   Guest rules          │                                          │
│   Review & publish     │                                          │
│                        │                                          │
│                        │  ← Back                 Continue →       │
└────────────────────────┴──────────────────────────────────────────┘
```

The sidebar communicates overall structure.

The progress header communicates the active section.

---

# Final Mobile Recommendation

Mobile should look conceptually like:

```text
3 of 7
Amenities
━━━━━━━━━━━━────────────

Current question or form

[ content ]

← Back

[ Continue ]
```

Optionally provide access to a separate progress overview, but do not permanently display all section names.

---

# Final Product Rule

Use this principle throughout the Add Accommodation experience:

> **Show progress by major section, not by every individual screen.**

Desktop should provide a persistent overview through a left-side section navigator.

Mobile should remain focused and compact, showing only the current section, position, and progress bar.

The result should make the host feel that they are completing a short, understandable setup process rather than working through a long form.
