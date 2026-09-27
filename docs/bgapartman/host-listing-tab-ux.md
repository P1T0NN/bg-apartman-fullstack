# Host Accommodation — Listing Tab UX Specification

## Purpose

The **Listing** tab is the main place where a host manages the content and configuration of a specific accommodation.

It should answer:

> **What does this accommodation contain, and what will guests see?**

The Listing tab is **not** a wizard.

It should be a **section-based editor overview** that lets the host quickly jump to the exact area they want to change.

Do not show:

- step counters
- progress bars
- Back / Continue wizard navigation
- one giant editable form
- calendar management
- account-level billing settings
- destructive account settings

Those belong elsewhere.

---

# Recommended Page Structure

At the top of the accommodation workspace, show:

```text
Seaside Apartment                         ● Published

[ View public listing ]                    [ ••• ]
```

Then the workspace tabs:

```text
Listing     Calendar     Settings
```

When **Listing** is active, show the listing editor overview below.

---

# Listing Tab — Desktop Overview

Recommended conceptual layout:

```text
Seaside Apartment                         ● Published

[ View public listing ]                    [ ••• ]

Listing     Calendar     Settings
────────────────────────────────────────────────


PROPERTY

Property basics                                      >
Apartment · 4 guests · 2 bedrooms · 3 beds

Location                                             >
Valencia, Spain

Amenities                                            >
24 selected

Photos & description                                 >
18 photos · Description added


BOOKING DETAILS

Pricing                                              >
From €140 / night

Guest rules                                          >
Check-in 15:00 · No smoking · Pets not allowed

Arrival information                                  >
Instructions added


OPTIONAL / ADVANCED

Accessibility                                        >
3 features added

Safety information                                   >
Smoke alarm · Fire extinguisher
```

The page should be an **overview of editable sections**, not the editor itself.

---

# Main UX Principle

The host should be able to scan the page and immediately understand:

- what information currently exists
- what may be missing
- what section to open
- whether the listing has any problems

Each row should therefore show:

1. Section title
2. Current value or summary
3. Optional status
4. Navigation affordance

---

# Section Row Design

A section row should look conceptually like:

```text
Property basics                                      >
Apartment · 4 guests · 2 bedrooms · 3 beds
```

or:

```text
Amenities                                            >
24 selected
```

or:

```text
Photos & description                         ⚠      >
4 photos · Add at least 1 more photo
```

Do not show only:

```text
Property basics     >
Location            >
Amenities           >
```

The current values make the overview useful even before the host opens a section.

---

# Recommended Section Groups

Use clear grouping rather than one long flat list.

Recommended groups:

## Property

- Property basics
- Location
- Amenities
- Photos & description

## Booking Details

- Pricing
- Guest rules
- Arrival information

## Optional / Advanced

- Accessibility
- Safety information

Only show groups relevant to the product.

Do not create empty groups just for visual symmetry.

---

# Property Basics

The summary row should show the most important accommodation attributes.

Example:

```text
Property basics                                      >
Apartment · 4 guests · 2 bedrooms · 3 beds
```

Possible editable fields inside:

- property type
- accommodation type
- entire place / private room / shared room
- maximum guests
- bedrooms
- beds
- bathrooms

When clicked, open a focused editor.

Example:

```text
← Listing

Property basics

[ focused editing form ]

[ Cancel ]                        [ Save changes ]
```

---

# Location

The overview should show a concise location summary.

Example:

```text
Location                                             >
Valencia, Spain
```

Do not expose the full private address in the overview if that is unnecessary.

Inside the editor, allow:

- address editing
- map location confirmation
- public location precision
- map pin adjustment

If changing the location could affect existing bookings, show an appropriate warning before saving.

---

# Amenities

Overview:

```text
Amenities                                            >
24 selected
```

When opened, use the full Amenity Manager.

The Amenities section should support:

- search
- categories
- selected count
- compact amenity choices
- detailed amenity sub-settings
- Save changes

Do not show dozens of amenities directly on the Listing overview.

---

# Photos & Description

Overview:

```text
Photos & description                                 >
18 photos · Description added
```

If something is missing:

```text
Photos & description                         ⚠      >
4 photos · Add at least 1 more photo
```

The editor can contain:

- photo upload
- photo removal
- reorder
- cover photo selection
- title
- description
- optional captions
- optional highlights

Photo editing can use more width than normal form sections because image management benefits from a wider layout.

---

# Pricing

Overview:

```text
Pricing                                              >
From €140 / night
```

The Listing tab should contain only **listing-level pricing settings**.

Examples:

- base nightly price
- cleaning fee
- extra guest fee
- standard discounts

If the product later has advanced pricing tools such as:

- seasonal pricing
- revenue management
- date-specific overrides
- complex rate plans

those can live in a dedicated pricing or calendar workspace.

Do not overload the Listing tab with operational pricing complexity.

---

# Guest Rules

Overview:

```text
Guest rules                                          >
Check-in 15:00 · No smoking · Pets not allowed
```

Possible editor fields:

- check-in time
- check-out time
- smoking
- pets
- parties/events
- quiet hours
- maximum occupancy rules
- cancellation policy
- no-show policy

Keep the summary concise.

---

# Arrival Information

Overview:

```text
Arrival information                                  >
Instructions added
```

or:

```text
Arrival information                          ⚠      >
Check-in instructions missing
```

Possible editor fields:

- check-in instructions
- property access
- key pickup
- door codes
- directions
- parking instructions
- host contact instructions

Only show guest-arrival information here.

Do not mix operational host notes into this section.

---

# Accessibility

If supported:

```text
Accessibility                                        >
3 features added
```

Possible fields:

- step-free entrance
- elevator
- accessible parking
- wide doorway
- accessible bathroom
- other structured accessibility features

Avoid vague marketing labels.

Use structured factual options.

---

# Safety Information

Example:

```text
Safety information                                   >
Smoke alarm · Fire extinguisher
```

Possible fields:

- smoke alarm
- carbon monoxide alarm
- fire extinguisher
- first-aid kit
- emergency information

Keep this section factual.

---

# Status Handling

The Listing tab should clearly show the accommodation status near the top.

Possible states:

```text
● Published
○ Draft
⚠ Action required
⏸ Paused
```

If action is required, show a clear message near the top.

Example:

```text
⚠ Action required

Your listing is missing required information.

Photos & description
Add at least 5 photos

[ Fix issue ]
```

The Fix issue action should open the relevant section directly.

---

# Section Statuses

Rows may use lightweight status indicators.

Examples:

```text
Property basics                              ✓
Location                                     ✓
Amenities                                    ✓
Photos & description                         ⚠
```

Do not turn the Listing tab into a completion dashboard unless the listing is incomplete.

For a fully published listing, keep the overview calm.

Only show warnings where the host actually needs to act.

---

# View Public Listing

Near the top, provide:

```text
[ View public listing ]
```

This should open the guest-facing listing.

The host should be able to compare:

- editor data
- public presentation

without navigating through the entire host dashboard.

---

# More Menu

Use a small secondary menu for infrequent actions.

Example:

```text
[ ••• ]
```

Possible items:

- Duplicate listing
- Pause listing
- Unpublish listing

Do not put common editing tasks in this menu.

Do not put Delete here if the product intentionally reserves destructive actions for Settings / Danger Zone.

---

# Desktop Width

The Listing overview can be wider than a normal form.

Recommended overview width:

```text
760–900px
```

This allows:

- section title
- current summary
- status indicator
- chevron / navigation affordance

Once a section is opened, use the normal focused editor width:

```text
Approximately 640px
```

Exceptions:

- photo manager
- amenity manager
- map editor

These may use more width when it improves usability.

---

# Desktop Layout with Host Sidebar

The existing host navigation remains visible.

Conceptual layout:

```text
┌───────────────────┬──────────────────────────────────────────────┐
│                   │                                              │
│ Dashboard         │ Seaside Apartment              ● Published │
│ Reservations      │                                              │
│ Calendar          │ [ View public listing ]              [ ••• ]│
│ Listings          │                                              │
│ Messages          │ Listing   Calendar   Settings                │
│                   │ ───────────────────────────────────────────  │
│                   │                                              │
│                   │ PROPERTY                                     │
│                   │ Property basics                          >   │
│                   │ Apartment · 4 guests · 2 bedrooms            │
│                   │                                              │
│                   │ Location                                 >   │
│                   │ Valencia, Spain                              │
│                   │                                              │
│                   │ Amenities                                >   │
│                   │ 24 selected                                  │
│                   │                                              │
│                   │ Photos & description                    >   │
│                   │ 18 photos · Description added                │
│                   │                                              │
└───────────────────┴──────────────────────────────────────────────┘
```

Do not add another permanent listing-specific sidebar.

The existing host sidebar is already the primary navigation.

---

# Mobile Listing Tab

On mobile, use a stacked settings-style list.

Example:

```text
← Listings

Seaside Apartment
● Published

[ View public listing ]     [ ••• ]

Listing   Calendar   Settings
──────────────────────────────


Property

Property basics                     >
Apartment · 4 guests · 2 bedrooms

Location                            >
Valencia, Spain

Amenities                           >
24 selected

Photos & description               >
18 photos · Description added


Booking details

Pricing                             >
From €140 / night

Guest rules                         >
Check-in 15:00 · No smoking

Arrival information                 >
Instructions added
```

The tabs may be horizontally scrollable if needed, but ideally keep all three visible.

---

# Mobile Section Editing

When a row is tapped, open a full-screen focused editor.

Example:

```text
← Listing

Amenities

[ editing interface ]

[ Save changes ]
```

Do not attempt to show the Listing overview and section editor at the same time on mobile.

---

# Saving Behavior

Use section-level saving.

Example:

```text
[ Cancel ]                 [ Save changes ]
```

Each section should save independently.

Do not use one global Save button for the entire Listing tab.

The user should always understand exactly what is being saved.

---

# Autosave

Autosave may be used only where it feels natural.

Good candidates:

- photo reorder
- cover photo selection
- some simple toggle interactions

Traditional forms should normally use explicit Save changes.

Do not mix autosave and explicit save in a confusing way.

---

# Unsaved Changes

If the host tries to leave a section with unsaved changes, warn them.

Example:

```text
You have unsaved changes.

[ Keep editing ]
[ Discard changes ]
```

Do not show this warning if nothing changed.

---

# What Must NOT Live in the Listing Tab

Do not place these here:

- full availability calendar
- portfolio-wide calendar tools
- account-level billing
- host payout account
- invoices
- account security
- delete account
- global notification settings

Those belong elsewhere.

Listing should remain focused on the accommodation itself.

---

# Relationship to Calendar Tab

The Listing tab manages:

> What the accommodation is.

The Calendar tab manages:

> When it can be booked.

Avoid duplicating the same operational calendar in both places.

A small availability summary or link is acceptable, but full date management belongs in Calendar.

---

# Relationship to Settings Tab

The Listing tab manages:

> Guest-facing accommodation content and listing-specific configuration.

The Settings tab manages:

> Listing behavior, billing context, publication controls, integrations, and destructive actions.

Do not blur these responsibilities.

---

# Final Information Architecture

The Listing tab should conceptually answer:

```text
PROPERTY

What is this accommodation?
Where is it?
What does it offer?
What does it look like?


BOOKING DETAILS

What does it cost?
What rules apply?
How do guests arrive?


OPTIONAL DETAILS

What accessibility features exist?
What safety equipment is available?
```

---

# Final Product Rule

Use this principle:

> **The Listing tab is the host's editable representation of the accommodation.**

It should be:

- non-linear
- section-based
- easy to scan
- easy to edit
- concise
- status-aware
- consistent with the public listing
- free from unrelated operational/account settings

The host should be able to open the Listing tab, understand the current state of the accommodation within seconds, and reach any editable section with one click or tap.
