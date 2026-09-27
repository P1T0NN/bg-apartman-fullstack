# Booking Search Results Page — UX & Implementation Specification

## Objective

Build the main accommodation search-results page for a booking website.

This page is where users:

- review available accommodations
- compare prices and ratings
- refine their search
- use filters
- sort results
- explore results geographically on a map
- open accommodation detail pages
- return without losing their search state

The experience must be optimized for **clarity, comparison speed, low friction, and strong map/list synchronization**.

The page should behave differently on desktop and mobile.

---

# Core UX Architecture

## Desktop

Use a split-screen layout:

- **Results area:** approximately 55–60% of usable width
- **Map area:** approximately 40–45%
- Keep the map visible while results scroll
- Keep the search criteria and filters easily accessible

Conceptual structure:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ LOGO       [ Valencia | 26–30 Sep | 2 guests ]     List property   Avatar │
├────────────────────────────────────────────────────────────────────────────┤
│ [Price] [Property type] [Bedrooms] [Rating] [Amenities] [Filters (2)]     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Valencia · 126 stays               Sort: Recommended ▾                    │
│                                                                            │
│ ┌───────────────────────────────┐        ┌───────────────────────────────┐ │
│ │ accommodation card            │        │                               │ │
│ └───────────────────────────────┘        │                               │ │
│                                          │                               │ │
│ ┌───────────────────────────────┐        │             MAP               │ │
│ │ accommodation card            │        │                               │ │
│ └───────────────────────────────┘        │      €420    €510             │ │
│                                          │               €380            │ │
│ ...                                      │                               │ │
│                                          └───────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

The search-results page should use much more horizontal space than the Add/Edit Accommodation forms.

Recommended desktop layout:

- outer page padding: 24–32px
- main content can use approximately 1440–1600px before very large outer whitespace
- gap between result list and map: approximately 24–32px

At narrower desktop/tablet widths, switch from split-screen to a list/map toggle rather than squeezing both.

---

# Search Criteria Editor

The search criteria from the homepage must remain visible and editable on the results page.

The user should **never need to return to the homepage** just to change:

- location
- dates
- guests
- room count, if the product supports hotel-style multi-room bookings

Recommended compact control:

```text
[ Valencia  |  26–30 Sep  |  2 guests  |  Search ]
```

or visually:

```text
┌───────────────────────────────────────────────────┐
│ Valencia  │  26–30 Sep  │  2 guests        🔍   │
└───────────────────────────────────────────────────┘
```

Each segment should be directly editable.

---

## Location Interaction

When the user selects the location segment:

```text
Where do you want to stay?

[ Valencia________________ ]

Recent searches
Valencia, Spain

Suggestions
Valencia
Valencia Province
...
```

The location autocomplete can also recognize exact accommodation names, but there should **not** be a separate prominent field labeled "Search apartment name".

Primary search intent should remain location-based.

---

# Property Name Search

Do **not** add a dedicated permanent field such as:

```text
Search apartment name
```

to the main search-results UI.

Instead:

- allow the location autocomplete to optionally recognize accommodation names
- optionally include a property-name field inside advanced filters later if needed
- keep property-name lookup secondary

---

# Dates Interaction

When dates are selected, open the calendar/date picker.

The user should be able to change:

- check-in
- check-out
- date flexibility, if supported later

Changing dates must immediately affect:

- availability
- result count
- prices
- map markers

---

# Guests Interaction

Guest selection should support the product's actual booking rules.

Example:

```text
Adults       −  2  +
Children     −  0  +
Infants      −  0  +
Pets         −  0  +
```

If the platform primarily offers whole apartments, the primary search should usually be:

```text
Location
Dates
Guests
```

Bedrooms, beds, and bathrooms should be filters rather than primary search inputs.

Only keep a "Rooms" field in the main search if the platform genuinely supports hotel-style bookings where one reservation may include multiple rooms.

---

# Filter Bar

Immediately below the main search controls, provide a compact horizontal quick-filter bar.

Recommended initial quick filters:

```text
[ Price ]
[ Property type ]
[ Bedrooms & beds ]
[ Guest rating ]
[ Amenities ]
[ Filters ]
```

Optionally add:

```text
[ Free cancellation ]
```

if cancellation flexibility is a major marketplace behavior.

Do not expose dozens of filter buttons horizontally.

The top filter bar is for the **most frequently used filters only**.

Everything else belongs in the full Filters manager.

---

# Applied Filter Count

If filters are active, display the number on the Filters control:

```text
Filters (3)
```

This number should represent active filter groups or selections consistently.

---

# Applied Filter Chips

After filters are applied, show removable chips above the results.

Example:

```text
[ €100–€250 × ] [ Pool × ] [ 2+ bedrooms × ] [ Rating 9+ × ]

Clear all
```

Requirements:

- each chip can be removed individually
- removing a chip immediately updates results and map
- Clear all removes all optional filters
- do not remove destination, dates, or guests through Clear all
- chips should appear only when filters are active

On mobile, chips may scroll horizontally.

---

# Full Filters Manager

The Filters button should open a comprehensive filter manager.

## Desktop

Use either:

- a large modal
- or a right-side drawer

Do not use a tiny popup.

Conceptual structure:

```text
┌────────────────────────────────────────────────────────────┐
│ Filters                                              [ X ] │
│                                                            │
│ Price range                                                │
│ €50 ───────────────●────────●──────────── €500+            │
│ [ €100 ]                           [ €300 ]                 │
│                                                            │
│ Property type                                              │
│ □ Apartment    □ House    □ Villa                          │
│                                                            │
│ Rooms                                                      │
│ Bedrooms          Any  1  2  3  4  5+                     │
│ Beds              Any  1  2  3  4  5+                     │
│ Bathrooms         Any  1  2  3  4+                        │
│                                                            │
│ Amenities                                                  │
│ □ Wi-Fi       □ Parking       □ Pool                       │
│ □ Kitchen     □ Air con       □ Washer                     │
│                                                            │
│ [ Show all amenities ]                                     │
│                                                            │
│                         Clear all    Show 47 properties     │
└────────────────────────────────────────────────────────────┘
```

The bottom CTA should show the result count:

```text
Show 47 properties
```

rather than a generic Apply button.

---

# Filter Groups

Recommended groups:

## 1. Price

- minimum price
- maximum price
- slider
- numeric fields

If dates are selected, clearly specify whether filtering refers to nightly price or total stay price.

## 2. Property Type

Possible values:

- Apartment
- House
- Villa
- Studio
- Hotel
- Guesthouse
- Other supported accommodation types

Only show types that actually exist in inventory.

## 3. Bedrooms, Beds, Bathrooms

Use simple segmented controls such as:

```text
Any  1  2  3  4  5+
```

## 4. Guest Rating

Examples:

```text
Any
7+
8+
9+
```

## 5. Amenities

Show common amenities first:

- Wi-Fi
- Parking
- Pool
- Kitchen
- Air conditioning
- Washer
- Heating
- TV
- Pet-friendly
- EV charger, if relevant

Then provide:

```text
Show all amenities
```

Do not expose 50+ amenities directly in the main filter panel.

## 6. Booking Options

Examples:

- Free cancellation
- Instant confirmation / instant booking, if supported
- Pay later, if supported
- No prepayment, if supported

## 7. House Rules

Examples:

- Pets allowed
- Smoking allowed
- Parties/events allowed, if relevant

## 8. Area / Neighbourhood

Allow filtering by meaningful subareas when inventory is large enough.

## 9. Distance

Potential future options:

- distance from city centre
- distance from selected landmark
- distance from beach
- distance from airport

## 10. Accessibility

Examples:

- step-free entrance
- accessible parking
- elevator
- wheelchair-friendly entrance
- accessible bathroom features

---

# Filter Design Principle

Do not add filters just because the database contains a field.

A filter should exist when:

1. users care about it
2. listings differ meaningfully on it
3. it helps users reduce the result set

The goal is:

> Lots of useful filtering capability without lots of visible interface clutter.

---

# Result Count

Always show the result count.

Examples:

```text
126 stays in Valencia
```

After filters:

```text
37 stays in Valencia
```

After searching a moved map area:

```text
18 stays in this area
```

---

# Sorting

Place sorting above the result list.

Example:

```text
126 stays in Valencia                   Sort: Recommended ▾
```

Recommended sort options:

- Recommended
- Price: low to high
- Price: high to low
- Guest rating
- Distance from centre

Potential later option:

- Most popular

Use **Recommended** as the default.

Do not default to Lowest Price.

---

# Search Result Cards

The card's job is to help users decide whether a property is worth opening.

Do not make the card a miniature property-detail page.

Recommended content:

```text
┌─────────────────────┐
│                     │
│       PHOTO         │ ♡
│                     │
└─────────────────────┘

Entire apartment · Valencia
Modern apartment near the beach

2 bedrooms · 3 beds · 1 bathroom

★ 4.9 · 87 reviews

€560 total
€140 / night
```

Optional:

- one or two important labels
- Free cancellation
- Free parking
- Highly rated
- Instant booking

Do not display huge amenity lists on the card.

---

# Total Price Display

When dates are selected, prioritize the **total stay price**.

Recommended:

```text
€560 total
€140 / night · 4 nights
```

Also communicate whether taxes and mandatory fees are included.

Avoid surprising users with major mandatory costs only at checkout.

---

# Card Image Gallery

Allow users to browse several images directly from the result card.

Example:

```text
[ ‹ ]        PHOTO        [ › ]

            • ○ ○ ○
```

Requirements:

- previous/next controls
- swipe on touch devices
- image count/dots optional
- consistent favorite/heart position

---

# Result Layout: Grid vs List

## Visual / Apartment Marketplace Style

If cards mainly contain:

- photo
- title
- location
- rating
- price

use a grid.

On a wide result pane:

```text
[property] [property]     | MAP
[property] [property]     | MAP
```

Two cards per row can work well in the left result area.

## Information-Rich Booking Style

If cards must display room type, bed configuration, cancellation, meal plan, payment conditions, and availability, use one horizontal result card per row.

Do not squeeze highly detailed cards into small visual tiles.

---

# Map

The map is a synchronized alternative view of the exact same result set.

The map should display only properties that satisfy:

- destination / map bounds
- dates
- guest capacity
- current filters

---

# Map Markers

Use price markers rather than generic dots.

Example:

```text
€142
       €180

             €127
```

The marker pricing must use the same price concept as the cards.

---

# Card ↔ Map Synchronization

On desktop:

- hovering a result card highlights its map marker
- hovering a marker may highlight its visible card
- clicking a marker opens a compact property preview

Example:

```text
┌─────────────────────┐
│ [photo]             │
│ Seaside Apartment   │
│ ★ 4.9 · 87 reviews │
│ €560 total          │
└─────────────────────┘
```

Clicking the preview opens the property details page.

---

# Map Scrolling Behavior

On desktop, keep the map sticky while users scroll results.

Avoid unnecessary nested scrollbars.

---

# Search This Area

Do not continuously refresh all results while the user is dragging or zooming the map.

Recommended behavior:

```text
User moves map
      ↓
[ Search this area ]
      ↓
User clicks
      ↓
Results + markers update
```

Potential future option:

```text
Search as I move the map
```

but do not make this the default initially.

---

# Zero Results After Filters

Never show only:

```text
No properties found.
```

Instead:

```text
No stays match all your filters.

Try removing one of these:

[ Pool × ]
[ Under €100 × ]

[ Clear all filters ]
```

Where possible, show counts next to filter values.

Example:

```text
Pool (12)
Parking (37)
Hot tub (3)
```

---

# Loading Results

Do not use endless infinite scroll with no stopping point.

Recommended approach:

```text
results
results
results
results

[ Show more stays ]

results
results
...
```

Use lazy-loaded images and result data.

---

# Back Navigation and State Preservation

This is critical.

Scenario:

```text
Search results
↓
scroll through many properties
↓
open accommodation
↓
press Back
```

The user must return to exactly where they were.

Preserve:

- destination
- dates
- guests
- filters
- sort
- map bounds
- currently loaded result batch
- scroll position
- selected map state when practical

Do not reset them to the top of the results.

---

# URL State

Meaningful search state should be reflected in the URL so refresh, share, browser Back, and browser Forward behave correctly.

Preserve:

- destination/location
- dates
- guests
- major filters
- sort
- map bounds when practical

---

# Responsive Breakpoint Behavior

## Wide Desktop

Use results + map side-by-side.

## Medium / Narrow Desktop or Tablet

At approximately below 1050–1100px:

- stop forcing split-screen
- show results as the primary view
- add a Map toggle
- retain quick filters
- keep the compact search editor

---

# Mobile Architecture

Do not show result cards and a map simultaneously.

Default to the result list.

Recommended top area:

```text
┌────────────────────────────────────────┐
│ 🔍 Valencia                           │
│    26–30 Sep · 2 guests               │
└────────────────────────────────────────┘
```

Tapping it opens the full search editor.

Below:

```text
[ Filters (2) ]    [ Sort ]    [ Map ]
```

Then applied-filter chips, result count, and cards.

---

# Mobile Filters

Open filters as a full-screen sheet or full-height bottom sheet.

Example:

```text
← Filters                            Clear

Price
...

Property type
...

Bedrooms
...

Guest rating
...

Amenities
...

──────────────────────────────────────

[ Show 47 properties ]
```

The bottom CTA should remain sticky.

Do not close the filter screen after every individual selection.

---

# Mobile Sort

Use a simple bottom sheet:

```text
Sort by

● Recommended
○ Price: low to high
○ Price: high to low
○ Guest rating
○ Distance from centre
```

Selection can apply immediately and close the sheet.

---

# Mobile Map

The map should become a separate full-screen mode.

Example:

```text
┌──────────────────────────┐
│ Valencia · 26–30 Sep     │
├──────────────────────────┤
│                          │
│          €135            │
│   €180          €220     │
│            €147          │
│          MAP             │
│                          │
│     €165                 │
│                          │
├──────────────────────────┤
│      [ Show list ]       │
└──────────────────────────┘
```

When a marker is selected, show a compact accommodation card near the bottom.

Provide an obvious **Show list** control.

---

# Favorite / Save

Result cards may include a heart/save button.

Behavior:

- logged-in user: save immediately
- logged-out user: open authentication flow, then return them to the same search state

Do not lose search results because the user authenticated.

---

# Performance Requirements

Prioritize:

- lazy-loaded images
- skeleton loading for cards
- debounced map interactions
- cached search state
- minimal full-page reloads
- incremental result loading
- responsive filter counts
- avoid rerendering the entire map unnecessarily

Never block the whole page because one image or one marker is slow.

---

# Loading States

Use localized loading.

- Initial search: card skeletons + map loading
- Applying filters: keep existing layout visible while updating
- Map search: subtle loading indicator

Avoid full-screen spinners unless absolutely necessary.

---

# Error States

If search fails:

```text
We couldn't load stays right now.

[ Try again ]
```

Preserve all current search criteria and filters.

Never clear user input because the network request failed.

---

# Analytics / Product Events

Suggested events:

```text
search_results_viewed
search_location_changed
search_dates_changed
search_guests_changed

filter_opened
filter_applied
filter_removed
filters_cleared

sort_changed

map_view_opened
map_moved
map_search_area_clicked
map_marker_clicked

listing_card_clicked
listing_favorited

show_more_clicked
zero_results_viewed
```

Also track:

- which filters are actually used
- which quick filters are used
- which filters produce zero results
- result position when a listing is clicked
- map vs list usage
- return-to-results behavior

---

# Recommended MVP Filter Priority

## Core

- Price
- Property type
- Bedrooms / beds
- Guest rating
- Amenities

## High Priority

- Free cancellation
- Pets allowed
- Parking

## Later

- Neighbourhood
- Distance to landmark
- Accessibility
- Advanced booking/payment filters

---

# Desktop Final Structure

```text
GLOBAL HEADER
Logo          Compact editable trip search          Account actions

QUICK FILTER BAR
Price | Property type | Bedrooms | Rating | Amenities | Filters

APPLIED FILTER CHIPS
Only when filters are active

MAIN CONTENT

LEFT ~55–60%                          RIGHT ~40–45%

Result count / Sort                   Sticky map

Property cards                       Price markers
Property cards                       Search this area
Property cards                       Selected marker preview
Property cards

Show more stays
```

---

# Mobile Final Structure

```text
HEADER

[ Valencia
  26–30 Sep · 2 guests ]

[ Filters ] [ Sort ] [ Map ]

Applied filter chips

126 stays

Property card
Property card
Property card
Property card

[ Show more stays ]
```

Map becomes a separate full-screen view.

---

# Product Rules

1. **Search criteria must remain editable from the results page.**
2. **Do not add a dedicated apartment-name search field to the primary interface.**
3. **Use only a small number of quick filters above results.**
4. **Put the full filter catalog inside one comprehensive filter manager.**
5. **Always show active filters outside the filter manager.**
6. **List and map must always represent the same filtered result set.**
7. **Use price markers on the map.**
8. **Use “Search this area” after map movement rather than constantly refreshing while dragging.**
9. **Prefer total stay price as the main comparison value when dates are known.**
10. **Keep result cards concise and comparison-focused.**
11. **Use grid cards for visually led inventory; horizontal cards for information-heavy booking inventory.**
12. **Show result count and sorting above the result list.**
13. **Default sort should be Recommended.**
14. **On mobile, use list OR map, not both simultaneously.**
15. **Mobile filters should be full-screen / full-height with a sticky “Show X properties” CTA.**
16. **Preserve search state, filters, map state, loaded results, and scroll position when users return from a listing page.**
17. **Reflect meaningful search state in the URL.**
18. **Use “Show more stays” rather than endless uncontrolled infinite scrolling.**
19. **Do not allow zero-result states to become dead ends.**
20. **Treat search, filters, results, and map as one synchronized system rather than four separate features.**

---

# Primary UX Principle

The search-results page is a comparison workspace.

The user should always understand:

- what they searched for
- what filters are active
- how many results remain
- where the properties are
- what each property costs
- how to adjust the search
- how to return without losing progress

Everything on the page should support those decisions.
