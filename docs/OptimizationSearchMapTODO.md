# Search Map Scaling TODO

## Goal

Keep the nine-item accommodation list, while making map work bounded as the
number of listings grows. Every matching accommodation should still be
represented on the map: as an individual pin when zoomed in, or as part of a
cluster with a correct count when zoomed out.

## Current behavior

- The list uses one-shot cursor queries and loads nine accommodations at a
  time.
- The map query uses pages of 500 and the client follows cursors until every
  matching accommodation in the viewport has been fetched. The 1,000-row read
  limit applies to each query call, not to the whole viewport request.
- The Convex query uses the latitude index, then filters longitude and the
  guest/bedroom minimums. Those post-index filters can require scanning rows
  inside the latitude range.
- The browser creates one map marker per matching accommodation, then the
  MarkerClusterer groups markers for display. Clustering reduces map clutter;
  it does not reduce fetched records or marker objects.
- A 400 ms bounds debounce and request IDs already reduce duplicate work and
  prevent stale responses from replacing newer results. Preserve these.

Relevant code: [search hook](../src/features/search/hooks/useSearchAccommodations.svelte.ts),
[map query](../src/convex/tables/accommodations/queries/fetchAccommodationsMapSearch.ts),
[query builder](../src/convex/tables/accommodations/helpers/buildAccommodationSearchQuery.ts),
[map marker lifecycle](../src/components/ui/custom-components/google-components/google-map/useGoogleMap.svelte.ts).

## Work order

### 1. Measure the current limit

- [x] Create or load a dense test dataset concentrated in Belgrade. Include
      representative guest and bedroom values.
- [x] Measure viewport query latency, rows read, number of query calls, response
      bytes, browser marker count, and time to update the map.
- [x] Test several densities, including the expected launch inventory and a
      larger growth case.
- [x] Set explicit targets from those measurements. Starting targets to
      evaluate: no more than 300 map features returned to the browser and a
      viewport update under one second at the 95th percentile on representative
      devices. Adjust these targets based on profiling.

Completed development baseline: 100, 1,000, and 10,000 added Belgrade fixtures,
three criteria/viewport cases, desktop and 4× CPU profiles, and 360 measured
samples. The assumed launch inventory is 1,000 until confirmed. Full-viewport
desktop p95 was 0.90 s, 1.21 s, and 5.93 s; the 10,000-fixture case returned
10,041 raw markers in 21 calls. Fixtures were cleaned up. Keep 300 features
and a one-second p95 as prototype targets; production and physical-phone
measurements remain follow-up validation.

See [method, measurements, and budgets](SearchMapBenchmark.md) and
[raw samples](SearchMapBenchmarkResults.json). Rerun with
`bun run benchmark:search-map` while `bun run dev` is running.

### 2. Choose the spatial lookup strategy

- [ ] Prototype a spatial rectangle query to replace the current latitude-only
      range plus longitude post-filter.
- [ ] Evaluate the [Convex geospatial component](https://github.com/get-convex/geospatial).
      Its repository currently labels it beta. Verify that its rectangle queries,
      filters, cursors, and operational maturity fit this app before adopting it.
- [ ] Specifically verify support for the existing `maxGuests >= guests` and
      `bedrooms >= rooms` conditions, antimeridian bounds, and planned search
      filters. The component's documented filter API may not cover every range
      condition directly.
- [ ] If it does not meet the query and scale requirements, compare a Convex
      spatial-cell read model with a dedicated geospatial database/service. Do not
      add a second data store until a benchmark shows it is needed.

Reference: [Convex index and filter behavior](https://docs.convex.dev/database/reading-data/indexes/).

### 3. Change the map response to be zoom-aware

- [ ] Pass map zoom with the viewport bounds to the map query.
- [ ] Return a bounded set of map features instead of draining every raw listing
      page:
  - Wide view: coarse clusters with stable cell IDs and counts.
  - Closer view: finer clusters.
  - Close view: individual accommodation pins.
- [ ] If a response would exceed the feature budget, use coarser clusters; do
      not silently drop accommodations.
- [ ] Make cluster clicks zoom to that cluster's bounds and fetch the next
      resolution.
- [ ] Ensure cluster counts reflect the active search criteria. Define how
      cells intersecting the viewport edge are counted so the map does not
      overstate results outside the visible bounds.
- [ ] Keep card-hover highlighting by mapping the hovered accommodation to its
      cluster's stable cell ID.
- [ ] Keep map totals accurate. When results are represented by cluster
      features, calculate the total from the represented listing counts, not from
      the number of rendered features.

### 4. Keep cluster summaries correct

- [ ] Decide how counts will honor guest and bedroom minimums and the filters
      that will be added later. Do not show unfiltered counts as if they were
      filtered counts.
- [ ] If summaries are maintained per spatial cell, update them in the trusted
      accommodation create, update, move, and unpublish paths.
- [ ] Add a backfill/rebuild and a consistency check for any maintained summary
      data.

### 5. Verify behavior and load

- [ ] Compare cluster counts with exact matching results on small fixtures,
      including cell edges and antimeridian bounds.
- [ ] Verify cluster expansion, individual pins, card-hover highlighting,
      rapid pans, out-of-order responses, empty cursor pages, and retry behavior.
- [ ] Load-test dense viewports and confirm query, payload, and browser feature
      budgets stay within the targets from step 1.
- [ ] Record the measured limit and the chosen spatial strategy here or in the
      relevant design doc.

## Acceptance criteria

- The nine-item list remains independently cursor-paginated.
- A map request does not fetch every accommodation in a dense viewport just to
  let the browser cluster them.
- Every matching accommodation is represented by an individual pin or a
  cluster whose count includes it.
- Counts respect the same active search criteria as the list.
- Map response size and browser feature count stay within measured budgets.
- Stale viewport results cannot replace results for the current viewport.
