# Add Accommodation UX

## Current scope

Use a seven-section wizard completed in one session. Keep entered values and
selected photos in page-local state. Nothing is saved to the backend until the
owner chooses **Publish accommodation** on the final review screen.

There is no autosave, resume flow, setup dashboard, or saved-progress record.
Leaving or refreshing discards unfinished entries. Show that clearly, without
a navigation warning or confirmation. Do not add analytics.

## Sections

1. **Property basics:** property type, entire/private/shared space, maximum
   guests, bedrooms, beds, and bathrooms. A studio has no separate bedrooms.
2. **Location:** street address, city, optional postal code, and country.
   Manual address entry is the current implementation; autocomplete and map
   confirmation require a provider decision.
3. **Amenities:** common choices first, with additional choices revealed on
   demand. Avoid a wall of checkboxes.
4. **Photos & listing:** 5?10 photos, cover selection, photo ordering, a title,
   and a description. Reuse the existing file picker, previews, compression,
   progress, and retry behavior. Selected photos remain available while moving
   between steps; upload them only when publishing.
5. **Price & availability:** nightly price, currency, minimum stay, and one
   available date range. Store prices in integer minor units.
6. **Guest rules:** local check-in/check-out times, smoking, pets, parties,
   and optional additional rules.
7. **Review & publish:** show the listing preview and section summaries with
   edit controls. Identify incomplete sections and require an explicit Publish
   action. Create the published accommodation only after full validation and
   successful photo uploads, then redirect to `/host/my-accommodations`.

## Navigation and validation

- Reuse the existing shared Form component without modifying template components.
  Validate accommodation section schemas directly when continuing; Form handles
  complete validation and submission on Publish.
- Render six individual step components inside the parent Form. Each component
  owns its fields. The shared Continue button calls the form hook, which selects
  the current section schema and runs safeParse.
  Back and review edit buttons preserve values and selected photos.
- Keep the Form upload field mounted while changing sections so file-preview
  URLs remain usable. Other step components can unmount because values live in
  the parent. Hide the uploader outside Photos and Review.
- Show field errors beside the relevant control. Validate all required details
  again at publication, including on the server.
- Enforce ownership of uploaded photos. A failed submission must not create a
  partial accommodation; keep entries available to retry.
- Prevent duplicate submissions while publishing and show upload progress.

## Responsive layout

Use one form column around 600-700 px, with the current section and step number
above it. Keep Back/Continue/Publish easy to reach on mobile. Review edit buttons
provide access to earlier sections; no separate StepItem navigation is needed.

## Later features

Defer listing duplication/import, address autocomplete/maps, blocked-date
editing, calendar synchronization, AI-generated descriptions, advanced fees,
and bulk property management until they are needed.
