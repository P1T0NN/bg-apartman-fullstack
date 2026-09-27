# Convex DataTable and DataList Filters

`DataList` and `DataTable` consume pagination state; they do not own remote
queries, cache keys, or invalidation. Feature code combines `useSearch`,
`useFilters`, and a pagination hook, then passes the resulting state to a
renderer.

## Filter contract

Filter definitions expose labels and symbolic values only:

```ts
{
  key: 'status',
  label: 'Status',
  options: [
    { value: '', label: 'All statuses' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' }
  ]
}
```

The server validates these values and maps them to known indexes or bounded
predicates. Ignore unknown keys and values. Never accept a client-supplied
column name, operator, or executable predicate.

For a new feature filter:

1. Define its `FilterDef` alongside the feature.
2. Map each accepted value in the feature's server query.
3. Add or reuse an index that matches the query shape.
4. Pass `filters.active` to the query and let the pagination hook reset when it
   changes.

Use equality and bounded ranges. Do not turn a filter into an unbounded table
scan. Convex subscriptions update list and table views after successful
mutations without manual refresh calls.

## Search, totals, and pagination

Use a Convex search index when a feature needs text search. Native search can
use relevance ordering and cursor pagination; the UI should not promise a
separate sort order unless the query guarantees it.

An exact total is optional. Use a counter or aggregate only when the product
needs that total and all trusted write paths keep it current. Omit exact
filtered totals when computing them would require reading every match.

The shared pagination contracts live in `paginationTypes.ts` and
`paginationTypesConvex.ts`. Convex owns cursor creation, validation, and
ordering; pass cursors through without decoding or constructing keyset
predicates. Use `useMutation` for browser-visible writes and rely on active
query subscriptions for synchronization.

## Verification checklist

- `bunx --bun oxlint`
- `bun run check`
- `npx convex dev --once`
- Verify next/previous page behavior after search and filter changes.
- Verify a create, update, and bulk delete while another browser tab has the
  list open.
