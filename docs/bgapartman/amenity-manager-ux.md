# Amenity Manager UX Specification

## Core Recommendation

For the **Add Accommodation** flow, the main Amenities step should stay lightweight.

Do not display the entire amenities catalog directly on the onboarding screen.

Instead:

```text
3 of 7
Amenities

Popular amenities

[ ✓ Wi-Fi ]       [ Parking ]
[ ✓ Kitchen ]     [ Air conditioning ]
[ Pool ]          [ Washer ]

[ + Add more amenities ]

                         Continue →
```

The **Add more amenities** action should open one centralized **Amenity Manager**.

This Amenity Manager becomes the scalable place for managing a large amenity catalog.

---

# Why Use a Centralized Amenity Manager

If the platform eventually supports:

- 30 amenities
- 50 amenities
- 80 amenities
- 100+ amenities

the normal onboarding page should not keep growing vertically.

The solution is:

```text
Main Amenities Step
        ↓
Popular / important amenities only
        ↓
Add more amenities
        ↓
Amenity Manager
```

This keeps onboarding fast while still giving hosts access to the complete catalog.

---

# Desktop Behavior

On desktop, the Amenity Manager should open as a **large dialog or overlay**.

Do not use a small centered modal.

A small modal becomes cramped once there are many categories and selections.

Recommended conceptual layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Amenities                                              [ X ] │
│                                                              │
│ [ 🔍 Search amenities...                                ]   │
│                                                              │
│ 12 selected                              [ View selected ]   │
│                                                              │
│ Popular                                                      │
│ ──────────────────────────────────────────────────────────── │
│ ☑ Wi-Fi                    ☐ Parking                         │
│ ☑ Kitchen                  ☑ Air conditioning                │
│                                                              │
│ Essentials                                                   │
│ ──────────────────────────────────────────────────────────── │
│ ☑ Towels                   ☑ Bed linen                       │
│ ☐ Heating                  ☐ Hair dryer                      │
│                                                              │
│ Kitchen & dining                                             │
│ ...                                                          │
│                                                              │
│                         [ Cancel ]   [ Save amenities ]       │
└──────────────────────────────────────────────────────────────┘
```

Recommended desktop behavior:

- Large centered dialog or overlay
- Roughly 800–950px wide
- Maximum height around 80–90% of the viewport
- Internal scrolling for the amenities list
- Keep the dialog header visible
- Keep Search visible
- Keep the bottom action area visible
- Only the amenity catalog should scroll

The dialog should feel like a complete management workspace, not a small popup.

---

# Desktop Amenity Manager Structure

The manager should contain:

1. Title
2. Close action
3. Search
4. Selected count
5. Optional View selected action
6. Categorized amenity list
7. Cancel
8. Save amenities

Example:

```text
Amenities

[ Search amenities... ]

12 selected
[ View selected ]

Popular
...

Essentials
...

Kitchen & dining
...

Bathroom
...

Bedroom & laundry
...

Internet & office
...

Entertainment
...

Outdoor
...

Parking & facilities
...

Safety
...

[ Cancel ] [ Save amenities ]
```

---

# Search

Once the amenity catalog is large, Search should be permanently available near the top.

Example:

```text
[ 🔍 Search amenities... ]
```

If the host searches:

```text
coffee
```

show matching options immediately.

Example:

```text
Kitchen & dining

☐ Coffee machine
☐ Espresso machine
```

Do not force users to know which category an amenity belongs to.

---

# Selected Count

Show how many amenities are currently selected.

Example:

```text
12 selected
```

Optionally allow:

```text
[ View selected ]
```

This can switch the manager into a filtered view containing only selected amenities.

Example:

```text
Selected amenities

✓ Wi-Fi
✓ Kitchen
✓ Air conditioning
✓ Washer
✓ Pool
...
```

This is especially useful when hosts have selected many items.

---

# Categories

The full amenity manager should organize amenities into logical categories.

Possible categories:

- Popular
- Essentials
- Kitchen & dining
- Bathroom
- Bedroom & laundry
- Internet & office
- Entertainment
- Heating & cooling
- Outdoor
- Parking & facilities
- Safety
- Accessibility
- Family
- Location features

The exact category names can evolve later.

The important principle is:

> Do not present 50–100 amenities as one flat list.

---

# Desktop Amenity Density

Do not make every amenity a large card.

The initial onboarding screen can use larger visual cards or chips for popular options.

The full Amenity Manager should be more compact.

Good desktop pattern:

```text
☑ Wi-Fi                         ☐ Ethernet
☑ Dedicated workspace           ☐ Printer
☐ Computer monitor              ☐ Desk
```

Two compact columns are appropriate because amenity items are short selection controls.

---

# Mobile Behavior

On mobile, do not display the Amenity Manager as a small floating modal.

Open it as a **full-screen manager**.

Conceptual layout:

```text
← Amenities

[ 🔍 Search amenities... ]

12 selected

Popular

✓ Wi-Fi
○ Parking
✓ Kitchen
✓ Air conditioning

Essentials                   3 selected
⌄

✓ Towels
✓ Bed linen
○ Heating

Kitchen & dining             4 selected
>

Outdoor                      2 selected
>

────────────────────────────

[ Save amenities ]
```

The user should feel like they temporarily entered a dedicated amenities screen.

---

# Mobile Category Behavior

Use collapsible categories.

Example:

```text
Essentials                   3 selected
⌄

Kitchen & dining             4 selected
>

Bathroom                     2 selected
>

Outdoor                      1 selected
>
```

Selected counts should appear next to categories.

This helps users understand where they have already made selections without opening every section.

---

# Mobile Search

Keep Search near the top:

```text
[ 🔍 Search amenities... ]
```

Search should filter across all categories.

The user should not need to manually expand categories before searching.

---

# Mobile Save Action

The Save amenities action should remain easy to reach.

A sticky bottom action area is appropriate.

Example:

```text
┌──────────────────────────────┐
│      [ Save amenities ]      │
└──────────────────────────────┘
```

The content above it can scroll independently.

---

# Returning to Add Accommodation

After the user saves the Amenity Manager, return them to the normal Amenities onboarding step.

Do not dump the entire selected catalog onto the page.

Instead show a concise summary.

Example:

```text
3 of 7
Amenities

12 amenities selected

[ ✓ Wi-Fi ] [ ✓ Kitchen ]
[ ✓ Pool ]  [ ✓ Washer ]
[ +8 more ]

[ Edit amenities ]

                     Continue →
```

The main Add Accommodation screen should remain simple.

---

# Main Amenities Step

The Add Accommodation Amenities step should prioritize common and important amenities.

Recommended initial amount:

```text
Approximately 8–12 popular amenities
```

Example:

```text
Popular amenities

[ ✓ Wi-Fi ]
[ Parking ]
[ ✓ Kitchen ]
[ Air conditioning ]
[ Pool ]
[ Washer ]
[ TV ]
[ Heating ]

[ + Add more amenities ]
```

Do not show all 50+ amenities by default.

---

# Add Accommodation Behavior

Recommended flow:

```text
3 of 7
Amenities
      ↓
Popular amenities
      ↓
Host selects common options
      ↓
Optional: Add more amenities
      ↓
Amenity Manager
      ↓
Save amenities
      ↓
Return to Amenities step
      ↓
Continue
```

The Amenity Manager should remain optional during onboarding unless certain amenities are required.

---

# Edit Accommodation Behavior

The **Edit Accommodation** experience should behave differently.

When the host goes to:

```text
Edit accommodation
        ↓
Amenities
```

open the **full Amenity Manager directly as the Amenities editor page**.

Do not open another dialog inside an Amenities editing page.

Recommended flow:

```text
Edit accommodation
        ↓
Amenities
        ↓
Full amenity manager
        ↓
Save changes
```

This avoids unnecessary layers.

---

# Add vs Edit

## Add Accommodation

Use:

```text
Popular amenities
        ↓
Add more amenities
        ↓
Large dialog on desktop
Full-screen manager on mobile
```

The purpose is to keep onboarding lightweight.

## Edit Accommodation

Use:

```text
Amenities
        ↓
Full amenity manager
```

The manager itself is the editing screen.

The purpose is direct maintenance.

---

# Amenity Data Structure

The UI should be designed around:

```text
CATEGORY
   ↓
AMENITY
   ↓
OPTIONAL AMENITY DETAILS
```

Example:

```text
Outdoor
├── Pool
│   ├── Private / shared
│   ├── Indoor / outdoor
│   └── Heated
├── Hot tub
├── BBQ
├── Balcony
├── Terrace
└── Garden
```

Another example:

```text
Parking
├── Parking
│   ├── Private / public
│   ├── Free / paid
│   ├── On-site / off-site
│   └── Covered / uncovered
└── EV charger
```

This prevents the amenity catalog from becoming full of near-duplicate options.

---

# Amenity Details

Some amenities can open additional controls after selection.

Example:

```text
✓ Pool

Pool type
○ Private
○ Shared

Location
○ Indoor
○ Outdoor

Heated
[ Yes / No ]
```

Example:

```text
✓ Parking

Parking type
[ Private ] [ Street ] [ Garage ]

Cost
○ Free
○ Paid
```

Example:

```text
✓ Wi-Fi

Internet speed (optional)
[ ______ Mbps ]
```

Do not turn every amenity variation into a separate top-level amenity.

---

# Interaction Rules

When the host opens the Amenity Manager:

- Load the currently selected amenities
- Allow changes without immediately affecting the listing
- Save only when the user confirms
- Cancel should discard unsaved changes
- Closing the dialog should warn only if there are unsaved changes
- Search should preserve current selections
- Collapsing categories should preserve current selections

---

# Visual Hierarchy

The hierarchy should be:

1. Search
2. Selected count
3. Category headings
4. Amenity options
5. Save action

Do not let decorative cards dominate the complete catalog.

The full manager should prioritize scanability and speed.

---

# Final Desktop Recommendation

```text
Main Amenities onboarding step
        ↓
[ + Add more amenities ]
        ↓
Large Amenity Manager dialog
        ↓
Search + categories + compact selections
        ↓
[ Save amenities ]
        ↓
Return to onboarding
```

---

# Final Mobile Recommendation

```text
Main Amenities onboarding step
        ↓
Add more amenities
        ↓
Full-screen Amenity Manager
        ↓
Search
Collapsible categories
Selected counts
        ↓
Sticky Save amenities button
        ↓
Return to onboarding
```

---

# Final Product Rule

Use one centralized **Amenity Manager** for the entire product.

For **Add Accommodation**, open it from the lightweight Amenities step.

For **Edit Accommodation**, use the Amenity Manager directly as the Amenities editing page.

On desktop, it should be a large dialog or overlay when launched from onboarding.

On mobile, it should be a full-screen temporary workspace.

Do not use a small modal for a large amenity catalog.
