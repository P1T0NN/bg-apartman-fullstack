# Search map baseline benchmark

Step 1 of [the scaling plan](OptimizationSearchMapTODO.md). This measures the
current cursor-draining implementation before changing its spatial lookup or
clustering strategy.

## Run

Start `bun run dev`, deploy the seed functions with `bunx convex dev --once`,
then run:

```powershell
bun run benchmark:search-map
```

The runner requires CLI access to the **development** deployment configured in
`.env.local`. It inserts 100, 1,000, and 10,000 deterministic Belgrade fixtures
in batches of 100, then removes only its unique benchmark owner in bounded
batches. Existing listings are preserved and contribute to the measured totals.
Do not run another viewport benchmark or edit application files during the run.
If interrupted forcibly, use the owner ID printed at startup and
call `seed:clearSeededAccommodations` with that owner repeatedly until it returns
zero. The existing seed cleanup function now removes at most 100 rows per call.

By default the runner uses the installed Windows Edge browser. Override
`BENCHMARK_BROWSER` with another Chromium executable if needed. It creates a
temporary browser profile and lets the browser choose a free debugging port.
`BENCHMARK_APP_URL` changes the app URL (default `http://localhost:5173`).
`BENCHMARK_DENSITIES` is an increasing comma-separated list of positive counts;
`BENCHMARK_REPETITIONS` defaults to 20 measured samples, plus one discarded
warm-up sample per case.

`bun run benchmark:search-map --read-only` measures the existing inventory
without seeding or requiring CLI administration access. Rows read and server
execution times are unavailable in that mode. It still requires `.env.local`
to identify the development deployment.

The manual harness is `/__benchmarks/search-map`. Its server load returns 404
outside development. No dependencies or production search changes are needed.

## Method

The harness composes the existing `useSearchAccommodations` and `SearchMap`:
the list remains independently paginated at nine items and the map follows its
500-item cursors until exhausted, including empty partial pages. Query timing
wraps the existing Convex client only inside the harness. The production hook,
map marker lifecycle, 400 ms bounds debounce, and stale-response guards are
unchanged.

All fixtures lie inside latitude 44.77–44.86 and longitude 20.40–20.53.
The existing deterministic seed generator supplies guests from 2–8 and
bedrooms from 1–4. Each density runs three cases:

- Whole viewport, no capacity minimums.
- Whole viewport, at least six guests and three bedrooms.
- Same latitude band, longitude 20.4512–20.4712, to expose longitude post-filter
  scan costs.

Each case runs at desktop width 1440 with normal CPU and width 390 with 4×
CPU throttling. The latter is a slower-device approximation, **not a physical
phone measurement**. The browser uses the local development app and the cloud
development database; record production-build and physical-device results
before making launch latency claims. Assume 1,000 launch listings and 10,000
growth listings until the intended launch inventory is confirmed.

Measurements written to `SearchMapBenchmarkResults.json`:

| Field              | Meaning                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `queryCalls`       | Actual map cursor query calls for the viewport                                                                                   |
| `queryMs`          | Sum of browser-observed map query durations, including network latency                                                           |
| `rowsRead`         | Sum of actual `usageStats.databaseReadDocuments` from Convex completion logs                                                     |
| `serverQueryMs`    | Sum of actual server execution durations, excluding network latency                                                              |
| `responseBytes`    | UTF-8 application JSON for all map page responses, including cursors; excludes WebSocket framing, compression, and list payloads |
| `markerCount`      | Raw accommodation markers supplied to the browser map (one managed marker per map record); clustering does not reduce this count |
| `listCount`        | Number of list items loaded independently, at most nine                                                                          |
| `renderMs`         | Last map response through list completion, Svelte flush, marker synchronization/clustering, and two animation frames             |
| `viewportUpdateMs` | Synthetic bounds update through rendering, including a 400 ms settling delay                                                     |

The settling delay uses the same duration as the existing debounce. The
benchmark does not simulate an actual drag, camera animation, cold SDK load,
tile downloads, or network throttling. P95 uses the nearest rank of the measured
samples. Frames establish a rendering boundary; they do not prove tiles finished
loading. Capture Chrome performance traces when investigating long render times.

The runner suppresses Vite HMR messages inside its browser to prevent reloads
from interrupting measurements; Convex WebSocket messages remain active.

Log events are matched by arrival order because the local and deployment clocks
can differ. Only map completions are retained. If the log count does not equal
the browser query count, row and server timing values are `null`, never estimated
from matching results. Convex's raw JSONL logs expose execution time and database
usage; see [CLI logs](https://docs.convex.dev/cli/reference/logs) and
[log fields](https://docs.convex.dev/production/integrations/log-streams).

## Results and targets

Measured on September 30, 2026 against the EU development deployment with
headless Edge 154 on Windows. Each of the 18 cases has 20 measured samples,
plus one discarded warm-up: 360 samples total. The existing inventory added
41 matching listings to each whole-viewport density. All 10,000 fixtures were
removed after the run. The list returned nine rows in every sample.

### Whole viewport, no capacity minimums

Query and render columns are their respective p95 values. Percentiles of
separate phases do not add up to the percentile of the whole update.

| Added fixtures | CPU | Raw markers | Rows read | Map calls | JSON bytes | Query p95 (ms) | Render p95 (ms) | Update p95 (ms) |
| -------------: | --: | ----------: | --------: | --------: | ---------: | -------------: | --------------: | --------------: |
|            100 |  1× |         141 |       141 |         1 |     22,505 |          420.1 |           113.1 |           904.8 |
|            100 |  4× |         141 |       141 |         1 |     22,505 |          238.8 |           994.3 |         2,285.8 |
|          1,000 |  1× |       1,041 |     1,041 |         3 |    166,416 |          602.7 |           225.8 |         1,205.6 |
|          1,000 |  4× |       1,041 |     1,041 |         3 |    166,416 |          700.4 |         2,762.7 |         4,932.4 |
|         10,000 |  1× |      10,041 |    10,041 |        21 |  1,604,054 |        3,659.0 |         1,994.8 |         5,933.5 |
|         10,000 |  4× |      10,041 |    10,041 |        21 |  1,604,054 |        6,311.5 |        15,612.7 |        22,985.3 |

### Reduced-result viewports

The six-guest/three-bedroom filter and narrow longitude bounds both still
read the whole latitude band. At the growth density they return only about
one quarter of the listings while reading all 10,041 rows.

| Added fixtures | Case                   | Markers | Rows read | Calls | JSON bytes | Desktop update p95 (ms) | 4× CPU update p95 (ms) |
| -------------: | ---------------------- | ------: | --------: | ----: | ---------: | ----------------------: | ---------------------: |
|            100 | Guests ≥6, bedrooms ≥3 |      35 |       141 |     1 |      5,645 |                   718.7 |                1,679.5 |
|            100 | Narrow longitude       |      25 |       141 |     1 |      4,001 |                   740.3 |                1,951.0 |
|          1,000 | Guests ≥6, bedrooms ≥3 |     225 |     1,041 |     2 |     36,173 |                   963.1 |                3,116.3 |
|          1,000 | Narrow longitude       |     255 |     1,041 |     2 |     40,968 |                 1,000.1 |                2,585.6 |
|         10,000 | Guests ≥6, bedrooms ≥3 |   2,115 |    10,041 |    11 |    339,766 |                 3,350.7 |                6,209.1 |
|         10,000 | Narrow longitude       |   2,532 |    10,041 |    11 |    406,029 |                 3,659.7 |                6,933.1 |

Full samples, server execution durations, and retained execution metrics are
in [SearchMapBenchmarkResults.json](SearchMapBenchmarkResults.json). One of
360 samples could not be correlated with the log stream; its `rowsRead` and
`serverQueryMs` are `null`. The tables use the consistent measured read count
from the other samples in that case. This run profiles the development app;
it does not establish a production or physical-phone limit.

### Targets for steps 2–5

Keep these as the initial budgets for the spatial/cluster prototype, and rerun
this matrix after changing it:

- **At most 300 map features** per viewport, including pins and clusters.
  Every matching listing must be represented in their counts. The full
  1,000-fixture and 10,000-fixture cases currently exceed this budget.
- **Viewport update p95 below 1,000 ms**, including the existing 400 ms
  settling delay. That leaves about 600 ms for querying, state changes,
  disposal, marker creation, clustering, and painting. Only the small whole
  viewport met this target on the tested desktop; no tested 4× CPU case did.
- **At most 75 KiB of application JSON** and **at most two map calls** per
  viewport. The current 1,000-fixture whole viewport is 162.5 KiB and three
  calls; the 10,000-fixture case is 1,566.5 KiB and 21 calls.
- **At most 2,000 database rows read across the entire viewport request**,
  as a provisional prototype budget. Preserve exact filtered counts while
  evaluating spatial lookup and maintained cluster summaries. The existing
  1,000-row per-call limit does not bound the total viewport work.

The feature budget is an upper bound to validate, not proof that 300 features
will meet the latency target. Keep it provisional until cluster rendering,
a production build, and representative physical phones are profiled. Of the
tested whole-viewport densities, only 141 raw markers were under one second
on desktop; the transition between 141 and 1,041 has not been located more
precisely. Fetched rows, payloads, and marker creation need bounded work as
inventory grows.

Validation: accommodation tests cover deterministic distinct seed batches,
capacity-filtered cursor draining, bounded cleanup, aggregate cleanup, and
preservation of another owner's listing. The Convex functions were deployed
to the development deployment before measurement.

Final checks: `bunx --bun oxlint`, Svelte check (zero errors/warnings), all ten
accommodation tests, and TypeScript checks for the backend and benchmark runner
passed. A read-only browser smoke check after cleanup confirmed the original
41 markers, one map call per sample, and nine list items.
