# Convex DataTable and DataList Search

## Data flow

Search and pagination stay in a live Convex query. A feature passes the search
term and its own validated filters to `useConvexPagination`; Convex returns one
bounded page and automatically refreshes subscribers after writes.

```text
SearchInput -> useSearch.term -> feature query -> indexed pagination
```

The client must not fetch a full table and filter it in memory, manually
construct cursors, or invalidate a Convex subscription after mutations.

## Client behavior

`useSearch` owns raw input, debounce, trimming, minimum-character handling, and
URL/state mode. Pass only `search.term` to the query. `useConvexPagination`
resets its cursor session when non-pagination arguments change and uses the
opaque cursor returned by Convex for previous/next navigation.

A feature query should validate its arguments and map symbolic filter values
to server-owned indexes and predicates. The browser must never provide a field
name, operator, index, or database expression. Native search can rank results
by relevance; do not assume it preserves a separate creation-date ordering.

## Totals and mutations

Exact totals are optional. Return one only when the server can compute it with
the same authorization and filter semantics as the page. Search and filtered
counts may require reading every match; cursor pagination does not need them.

Use Convex mutations for writes. Active query subscriptions refresh
automatically. Keep uploaded-file validation and cleanup in the trusted server
boundary.

## Reusable files

- `src/features/search/hooks/useSearch.svelte.ts`
- `src/features/pagination/hooks/useConvexPagination.svelte.ts`
- `src/shared/features/pagination/types/paginationTypes.ts`
- `src/shared/features/pagination/types/paginationTypesConvex.ts`
- `src/convex/helpers/getPagination.ts`
- `src/convex/wrappers/fetchOptimizedQuery.ts`
- `src/convex/helpers/paginateSearch.ts`

## Verification

Run:

```text
bunx --bun oxlint
bun run check
npx convex dev --once
```

Then verify that search resets pagination, next/previous pages stay bounded,
and a mutation is visible in another subscribed tab without a manual refresh.
