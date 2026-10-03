# Reusing timezone logic

Copy `src/features/timezone` and `src/shared/features/timezone` together. Install
`lltz`, `zod`, and `@internationalized/date`. The relative imports are independent
of this project's aliases, translations, forms, and backend.

This browser implementation requires Vite's `?url` asset imports. The production
build emits the dataset shipped with `lltz`; no external timezone API or key is
needed. Only the browser feature imports `lltz`. Shared schemas and conversion
utilities can also run in Convex or another backend.

Call `useTimeZone(onChange)` during component initialization, then call
`resolve({ latitude, longitude })` from the map pin event. Bind the callback to
your input/state. Read `pending` and `error` through the returned getters. Error
codes are `unavailable` and `ambiguous`; callers provide translated text. `clear()`
invalidates outstanding results and empties the value. A later pin always wins.

The full boundary asset in `lltz` 1.4.0 is approximately 45 MiB uncompressed.
It loads on the first lookup, is shared by concurrent calls, and stays in memory
for later pins. Configure static asset caching/compression in production. Failed
downloads can be retried. Locations with multiple zones are rejected rather than
silently choosing a zone.

`timeZoneSchema` validates IANA identifiers and `timeZoneCoordinatesSchema`
validates coordinates. Server validation of these values does not prove that a
submitted identifier geographically matches its coordinates. Add server-side
lookup separately if that guarantee is required by another project.

`getIsoDateInTimeZone` produces a local calendar date from an absolute instant.
`getZonedTimestamp` converts a local date/time to Unix milliseconds and rejects
missing/repeated DST times. Accommodation bindings and immutable booking terms
remain in their respective project features.

`formatZonedDateTime` formats an absolute instant with a named month, year,
24-hour time and the offset that applies on that date. Callers supply locale and
IANA timezone; guest/browser-local defaults never replace the supplied zone.
