# Coding rules and reuse map

Global engineering rules for this starter. Domain rules for the accommodation
marketplace, bookings, favorites, feedback, and newsletters live in
[`ProjectCodingRules.md`](./ProjectCodingRules.md); read both before changing
code. The longer design notes are
[`BookingPageDesign.md`](./BookingPageDesign.md),
[`DataTableSearchSystemDesign.md`](./DataTableSearchSystemDesign.md),
[`FiltersDataTableAndList.md`](./FiltersDataTableAndList.md),
[`InfiniteScrollingSystemDesign.md`](./InfiniteScrollingSystemDesign.md), and
[`RateLimitingSystemDesign.md`](./RateLimitingSystemDesign.md).

## Choose the existing layer first

| Need                                   | Use                                                          |
| -------------------------------------- | ------------------------------------------------------------ |
| Primitive UI or accessible overlay     | `src/components/ui/<family>` and its `index.ts` barrel       |
| Browser-native progressive enhancement | `src/components/ui/native-components`                        |
| Repeated list/table state and chrome   | `DataList`, `DataTable`, `PaginatedData`, `InfiniteScroll`   |
| Repeated form and upload workflow      | `Form` plus `FieldConfig`                                    |
| Reactive component logic               | a `.svelte.ts` hook in `src/hooks` or `src/features/*/hooks` |
| Convex data                            | `useQuery`/`useMutation`, or the pagination hooks            |
| Pure shared logic/types/config         | `src/shared` (domain-neutral) or the owning feature          |
| Page-only composition                  | `src/components/pages` or the route itself                   |

Do not make a new abstraction for one caller. Promote it only after the same
mechanics are needed in a second feature.

Name non-obvious boolean expressions before branching. Collection work,
encoded checks such as duplicate detection, and multi-clause business rules
belong in a descriptive `const` used by the `if`; keep direct guards when the
condition is already self-explanatory, such as `if (!record)` or
`if (items.length === 0)`. For example, write
`const hasDuplicateKeys = countDistinctBy(keys, (key) => key) !== keys.length;`
and then `if (hasDuplicateKeys)`, not the expression inline in the `if`.

## Protected components

Treat `src/components/ui/native-components` and
`src/components/ui/custom-components` as read-only building blocks. Do not edit
them to adapt a single caller, match a local layout preference, or add
feature-specific behavior; compose or wrap them from the feature/page instead.

Editing either family is strictly prohibited unless the component itself
genuinely must change for something to work and that edit has been explicitly
approved. When an edit is approved, keep it minimal, preserve every existing
caller, and state why it was required.

## Project shape and request flow

- `src/routes` owns URL structure, layouts, page composition, and server load.
  The root `+layout.server.ts` supplies `authState` and `currentUser`; the
  `(protected)` and `/admin` server layouts redirect before rendering.
- `src/features` owns a vertical capability (auth, search, filters,
  pagination, and uploads). Put feature-specific text,
  defaults, schemas, and types there.
- `src/components/ui` is the reusable design-system layer. `custom-components`
  compose primitives; `native-components` prefer platform APIs and lazy-load a
  shadcn fallback when support is missing.
- `src/convex` is the server boundary. The client calls generated references
  from `@convex/_generated/api`; it never sends an owner id, database field,
  index name, or predicate expression as authorization input.
- `src/shared` contains values imported by both browser and Convex (branding,
  feature contracts, schemas, and pure utilities). Keep secrets and server-only
  modules out of it.

## Page component decomposition

When creating or substantially changing a page, keep the route focused on data
loading, page-level state, and composition. Put its presentational pieces under
`src/components/pages/<page>` (for example, `(protected)/accommodations`) using these
locations:

- Loading UI always lives in
  `src/components/pages/<page>/loading/<component-name>-loading.svelte` and is
  imported by the page or component that displays it.
- Markup rendered for each keyed list/table item always lives in
  `src/components/pages/<page>/<component-name>-item.svelte`; the owning
  `{#each}`/`DataList`/`DataTable` renders that item component.
- Page-header markup and logic always lives in
  `src/components/pages/<page>/<component-name>-header.svelte`.

Keep a function directly inside the component that alone uses it. Do not lift a
child-only function into the page and pass it back as a callback. Pass no props
when the child can obtain what it needs itself; otherwise pass only the values
the function actually depends on and implement the function in that child.
Promote a function to a shared hook or utility only when multiple components
genuinely use it.

For `DataList` and `DataTable` headers:

- Without an enclosing `Card`, render `<component-name>-header.svelte` through
  the component's `header` snippet.
- Inside an enclosing `Card`, render `<component-name>-header.svelte` directly
  above `DataList` or `DataTable`, not through its `header` snippet.

## Svelte 5 rules

- Runes mode is forced in `vite.config.ts`. Use `$state` for owned mutable UI
  state and `$derived`/`$derived.by` for synchronous, side-effect-free values.
- `.svelte.ts` files are reusable reactive logic. Call hooks during component
  initialization, return state through getters, and pass changing inputs as
  getter functions. Destructuring a returned getter or a reactive prop freezes
  the value.
- `$effect` is exceptional. It is reserved for external synchronization
  without a `useQuery` success callback, never for derived state. Do not use
  effects for calculations, debouncing, URL writes, or state mirroring when an
  event handler, `$derived`, `onMount`, or attachment works. The current
  allowed effect locations are listed in
  [`ProjectCodingRules.md`](./ProjectCodingRules.md).
- Use `$state.snapshot` before passing a deeply reactive proxy to code that
  expects plain data (the form-change hook does this). Do not export a directly
  reassigned `$state` binding from a module; expose an object or functions.
- Type `$props()` and use snippets for composition. Prefer `{@render}` over
  legacy slots. Use `{#key}` only when a child must be recreated with fresh
  local state (an edit form is keyed by record id).
- DOM/global APIs belong behind `onMount`, event handlers, or `{@attach}`. Keep
  SSR-safe code free of `window`, `document`, `navigator`, and object URLs.

## UI primitives (`src/components/ui`)

Import from the family barrel and compose the exported parts. Single-part
families use named imports (`{ Button }`, `{ Input }`); multi-part families use
the namespace (`* as Card`, `* as Dialog`). `components.json` is the source of
truth: aliases are `@/components`, `@/utils`, and `@/hooks`, the theme CSS is
`src/routes/layout.css`, and the icon library is Lucide.

| Family                        | Parts / use                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Avatar                        | `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` — faces and identity fallback                    |
| Badge / Button                | statuses, compact actions, links, and variants                                                                                               |
| Breadcrumb                    | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`            |
| Card                          | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`                                              |
| Field / Label                 | labelled form controls, descriptions, errors, sets, legends, and field groups                                                                |
| Input / Textarea / Checkbox   | native text, multiline, and boolean controls                                                                                                 |
| InputGroup                    | `InputGroup`, `InputGroupInput`, `InputGroupTextarea`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText` — controls with icons/actions |
| InputOTP                      | `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator` — verification codes                                                        |
| Select                        | grouped custom select, labels, items, scroll buttons, portals                                                                                |
| Pagination                    | pagination root/content/items/links/previous/next/ellipsis primitives                                                                        |
| Drawer / Sheet                | modal bottom-sheet and side-panel composition                                                                                                |
| Sidebar                       | full shadcn sidebar provider/root/content/menu/group/trigger pieces; used as native-sidebar fallback                                         |
| Tabs                          | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                                                                                             |
| Table                         | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`, `TableCaption`                                     |
| Empty / Separator             | structured empty states and visual separators                                                                                                |
| Skeleton / Spinner / Progress | loading placeholders, pending actions, progress indicators                                                                                   |
| Tooltip / Sonner              | tooltip composition and the single app-wide toast mount                                                                                      |

Use semantic tokens (`bg-background`, `text-muted-foreground`,
`text-destructive`) and built-in variants before custom colors. Use `cn()` for
conditional classes, `gap-*` instead of `space-*`, and `size-*` for equal
width/height. Do not add manual overlay z-index or `dark:` color overrides.
Dialogs, sheets, drawers, tabs, grouped menu items, cards, avatars, alerts,
empty states, skeletons, badges, and buttons follow the shadcn composition
rules; every dialog-like surface has an accessible title.

## Custom UI components (`src/components/ui/custom-components`)

| Component                                                                                                              | Use                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Section`                                                                                                              | Full-width semantic band with centered width, horizontal padding, and vertical rhythm; `class` styles the band and `containerClass` styles the inner container. |
| `SvelteHead`                                                                                                           | Page title, description, canonical URL, Open Graph/Twitter tags, robots, and escaped JSON-LD from `COMPANY_DATA`. Use once per page.                            |
| `Header`                                                                                                               | Public/app header with Better Auth session, avatar menu, sign-in link, and logout.                                                                              |
| `TabsUrl`                                                                                                              | Controlled shadcn tabs whose active value is stored in a URL search parameter (push history by default).                                                        |
| `LocalizedValue` / `BadgeLocalized`                                                                                    | Resolve `value -> locale -> English -> raw value`; the latter wraps the result in a `Badge`.                                                                    |
| `Plural`                                                                                                               | ICU `Intl.PluralRules` (`one`, `few`, `many`, `other`) for count labels.                                                                                        |
| `CopyValue`                                                                                                            | Clipboard copy button with truncated value, live confirmation, and timer cleanup.                                                                               |
| `ShareValue`                                                                                                           | Icon-only share button; copies its `value` to the clipboard and confirms with a success toast.                                                                  |
| `Counter` / `FormCounter`                                                                                              | Accessible min/max increment/decrement control; the form renderer handles `kind: 'counter'` fields.                                                             |
| `EmailInput` / `PasswordInput`                                                                                         | InputGroup wrappers with email-domain suggestion and password visibility toggle.                                                                                |
| `EmptyData` / `ErrorComponent`                                                                                         | Standard empty state (optional card/icon/action) and safe retry error block.                                                                                    |
| `PaginatedData`                                                                                                        | Presentational previous/next controls and page/total label; cursor state stays in the hook.                                                                     |
| `DataList`                                                                                                             | Generic `<ul>` harness for page pagination or infinite scrolling; accepts header, row, loading, error, empty, and key snippets.                                 |
| `DataTable`                                                                                                            | Generic table harness for page pagination, optional row selection, selection actions, custom head/row/loading/error/empty snippets.                             |
| `DataTableItem` / `DataTableSelectionBar` / `DataTableItemsLoading`                                                    | Internal row selection behavior, bulk-action bar, and table/list skeleton rows.                                                                                 |
| `InfiniteScroll`                                                                                                       | IntersectionObserver attachment plus accessible loading, retry, load-more button, and end states; it does not know Convex.                                      |
| `Form`                                                                                                                 | Generic Convex mutation/action form driven by `FieldConfig`; owns validation, pending state, toast handling, R2 uploads, and optional `captchaAction`.          |
| `CaptchaField`                                                                                                         | CAPTCHA feature field; `Form` renders it automatically when `captchaAction` is set, while native forms compose it directly with `useCaptcha`.                   |
| `FormField`, `FormInput`, `FormTextarea`, `FormSelect`, `FormCheckbox`, `FormCounter`, `FormSection`, `FormUploadFile` | `Form` field renderer pieces. Add a `custom` field/snippet before creating another form component.                                                              |
| `StaticImage`                                                                                                          | Normal `<img>` prop forwarding with every non-empty `src` passed through `$app/paths.asset`; use for site-relative static assets.                               |

## Native-first components (`src/components/ui/native-components`)

These are the preferred wrappers when the browser has a suitable platform
primitive. Fallback files are implementation details and should not be
imported directly.

| Component                                                             | Native path and fallback                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NativeAvatar`                                                        | Image with initials fallback; use for user identity wherever a face may be missing.                                                                                                                                                                                                                                       |
| `NativeDialog`                                                        | Native modal `<dialog>` with `showModal`, explicit close snippets, focus/backdrop behavior, and no click-outside/Esc dismissal.                                                                                                                                                                                           |
| `NativePopover`                                                       | Popover API + CSS anchor positioning; light-dismiss and Esc are browser-owned.                                                                                                                                                                                                                                            |
| `NativeSelect`                                                        | Styled native `<select>` when `appearance: base-select` is supported; otherwise shadcn `Select`. Forwards `name`, `required`, `disabled`, and the error `aria-*` attributes; `placeholderOnly` keeps the placeholder out of the option list. Its styles live in `@layer components`, so Tailwind utilities override them. |
| `NativeSheet` (`NativeSheetFallback`)                                 | Native dialog command API and discrete slide transition; otherwise shadcn `Sheet`.                                                                                                                                                                                                                                        |
| `NativeTooltip` (`NativeTooltipFallback`)                             | Interest Invoker + Popover APIs; otherwise lazy-loaded shadcn `Tooltip`.                                                                                                                                                                                                                                                  |
| `NativeSidebar` (`NativeSidebarFallback`)                             | Desktop `<details>` disclosure and mobile shadcn `Sheet`; unsupported desktop browsers lazy-load shadcn `Sidebar`.                                                                                                                                                                                                        |
| `NativeSidebarContent` / `NativeSidebarSection` / `NativeSidebarLink` | Main-content spacing, labelled sidebar groups, and active nested-route links via `usePathname`.                                                                                                                                                                                                                           |
| `NativeSidebarPageHeader`                                             | Mobile sidebar trigger plus route-id/parameter-aware breadcrumbs.                                                                                                                                                                                                                                                         |
| `NativeSidebarUser`                                                   | Session-aware account trigger/popover and logout action.                                                                                                                                                                                                                                                                  |

## Feature components and hooks

| Area       | Existing pieces and intended use                                                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth       | `SignInForm`, `SignUpForm`, `ForgotPasswordForm`, `VerifyEmailForm`, and `LogoutButton`; `useAuth` centralizes Better Auth calls, error codes, pending state, OTP/password/social flows, and redirects. Keep wording in components via `ERROR_MESSAGES`. |
| Search     | `SearchInput` is an InputGroup with clear button and optional listbox snippet. `useSearch` owns raw value, debounce, trim, minimum two-character gate, and `state`/`url` mode. Pass only `search.term` to a query.                                       |
| Filters    | Filter defs define symbolic options. `useFilters` owns state/URL mode, active values, count, clear methods, and stable `identity`; feature filters belong with their feature.                                                                            |
| Pagination | `useConvexPagination` owns page/cursor sessions; `useConvexInfinitePagination` owns accumulated pages, duplicate protection, retry, and reset. `createConvexPaginationQuery` is their shared subscription builder.                                       |
| Uploads    | `UploadFile`, `UploadFileDropzone`, `UploadFilePreviewItem`, and `useUpload` manage previews, object-URL cleanup, multiple-file ordering, cover selection, and removal. `optimizeToWebp` is the browser compression step.                                |

The admin page components are intentionally page-specific: user list/header
rows, user profile/settings/sessions/logs tabs, ban/unban/role actions, and
their loading skeletons. Reuse the generic `DataList`, `DataTable`, `Card`,
`Badge`, `NativeDialog`, `NativeSelect`, and query hooks inside new admin
screens instead of copying those page components.

Operation input schemas use the exact function name plus `Schema`; reusable
data schemas keep descriptive names. Domain schema names are listed in
[`ProjectCodingRules.md`](./ProjectCodingRules.md).

Keep ordinary Zod schemas free of custom messages: `z.enum(...)`, `.min(...)`,
and `.max(...)` use the global translated defaults in `src/lib/validation.ts`,
loaded once through `src/hooks.ts` for SvelteKit's browser and server runtimes.
Edit their wording under `ValidationMessages` in `messages/en.json`.
Use those shared categories everywhere, including field hints and translated
backend validation errors. For errors shown away from a field, keep its label
alongside the generic message when needed (for example, password length).
Use `ErrorMessages.unexpected` for unknown action failures and
`ErrorMessages.loadFailed` for content-loading failures; do not add a separate
translation for each page or button. Reserve custom wording for a distinct
cause or recovery step the shared messages cannot explain, such as mismatched
passwords, expired codes, missing uploads, permissions, or cross-field rules.
The map changes error text only; required strings still need `.trim().min(1)`.
Zod coercion happens before error mapping (for example, an empty numeric string
coerces to zero); define input normalization in the schema when needed.
Custom cross-field refinements use `params: { code: 'UPPERCASE_CODE' }` and a
case in `validation.ts`. Do not set `error`/`message` for those codes: explicit
messages override the global map. Keep translation imports out of shared
schemas and the app's validation setup out of Convex; backend failures use
structured codes and `getBackendErrorMessage` as described below.

## Form submission

`Form` requires a Zod `schema`. It validates a snapshot of
`{ ...values, ...extraFields }` with `safeParseAsync` before CAPTCHA, uploads,
or the Convex call, and submits the parsed output. Put defaults, coercions,
optional-empty handling, and conditional validation in that schema. Native
`required`/`type` attributes describe controls; Zod decides whether to submit.
Shared template components and hooks are read-only unless explicitly
authorized; keep feature-specific behavior in the owning feature and compose
existing Form fields/snippets instead of extending the template API.

- `extraFields` is a plain object of additional arguments, such as
  `extraFields={{ id: record._id }}`. It overrides whole top-level values and
  must be included in the schema. Zod object schemas strip undeclared keys.
  Pass reactive expressions to keep request data current; initialize
  browser-only values in an event handler or `onMount`.
- Name nested controls `address.street`, `address.city`, etc. `getValue`,
  `setValue`, and `bind:values` use the same nested object. Dotted paths address
  objects; pass arrays as whole values from custom controls or `extraFields`.
- Hidden controls retain their values. For conditional payloads, use a Zod
  discriminated union: one branch strips a previously entered address while the
  other validates it.
- `customFields` is the rendering snippet formerly named `extraFields`.
  Snippet contexts expose `errors`; custom field contexts also expose `error`.
  Connect custom controls' `aria-invalid` and `aria-describedby` to that error.
- `prepareArgs`, `UploadPrepareContext`, and `PreparedMutationArgs` are removed.
  Do not recreate the entire payload in a replacement callback.
- Form attaches `uploadedFiles`, `retainedFiles`, and `turnstileToken` after
  validation. These transport fields are not inputs to the form schema.
  Upload actions validate storage keys on the server. Keep form schemas focused
  on business fields and preserve ownership checks at the mutation boundary.

## Shared hooks, state, and utilities

- `useSearchParams` owns only declared URL keys, preserves all other query
  parameters/path/hash, supports replace/push history, and exposes popstate
  cleanup. Use it instead of hand-building query strings.
- `usePathname` normalizes trailing slashes and matches exact or nested paths.
- `useFormChanges` snapshots initial values, exposes reactive `values`,
  `isDirty`, and `changedValues` for edit forms.
- `useSelectable` is the shared `SvelteSet` row-selection state behind
  `DataTable`; provide a stable item key when indexes can change.
- `useCachedConvexQuery` displays the last successful snapshot while a query
  reconnects. `convexQueryCache` is a bounded 50-entry LRU and is cleared on
  logout. `cacheQuery` is a separate generic cache for retaining SvelteKit
  `query()` proxies; it is not a Convex refresh mechanism.
- `IsMobile` is the `MediaQuery` class used by responsive native/sidebar code.
- `cn`, element-ref/child types, `toastMessage`, date formatters, initials,
  UTF-8 base64 helpers, HTML escaping, and error-code mapping already live in
  `src/utils` or `src/shared/utils`; reuse them before adding equivalents.
- `COMPANY_DATA` is the branding source for UI, emails, JSON-LD, and links.
  `pageEndpoints.ts` uses `resolve()` so links survive a non-root base path.

State choice: local interaction state uses `$state`; computed state uses
`$derived`; shareable/searchable state uses URL mode; server truth uses a live
Convex query. Convex subscriptions are independent: three `useQuery` calls may
render as each resolves unless the page deliberately combines their loading
flags or waits on `Promise.all`.

## Algorithms, complexity, and database lookup rules

Big-O describes how an operation scales; it is **not** an API or algorithm name.
Do not create helpers named `O(n)`, `O(logN)`, or similar. Choose the concrete
operation/data structure first, then use its complexity to judge whether it is
appropriate. Reuse the implementations and detailed examples in
`src/shared/lib/algorithms/README.md` before adding another algorithm helper.
Keep feature-only collection logic local until the same mechanics are genuinely
needed by a second caller.

### Database first, in-memory algorithms second

For Convex-backed data, narrow the data **before** it reaches TypeScript memory.
Do not fetch or `.collect()` an entire growing table so that client/server
TypeScript can search, sort, count, deduplicate, or build a `Map` over it.
The normal flow is:

1. Let Convex identify the smallest useful result set with direct id lookup,
   indexes/search indexes, ordering, aggregates, and bounded pagination.
2. Return only that bounded result set.
3. Use `src/shared/lib/algorithms` only for transformations/lookups on data that
   is already in memory.

Use these choices for Convex/database work:

| Need                                                | Prefer                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| One document when its Convex `_id` is already known | direct `ctx.db.get(...)` lookup                                           |
| Equality/range query by known fields                | an appropriate schema index + `.withIndex(...)`                           |
| Full-text search                                    | the configured Convex search index, not an in-memory scan                 |
| A potentially large result list                     | indexed ordering plus `.take(...)` / pagination; keep it bounded          |
| Routine exact totals/counts over growing tables     | existing aggregate/counter/materialized projection; do not scan the table |
| Small result set already returned by Convex         | in-memory helpers below are appropriate                                   |

An in-memory `O(log n)` or `O(1)` lookup does **not** repair an inefficient
query that first fetched `n` database documents. Optimize the database boundary
first. `chunk()` is for batching an array already in memory; it is not database
pagination.

### In-memory algorithm choice

Use the simplest operation that fits the already-loaded, bounded data:

| Need                                           | Utility / structure                                                                       | Typical time                        | Use when                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| Exact key lookup many times                    | `indexBy()` / `uniqueIndexBy()` then `Map.get()`                                          | build `O(n)`, lookup `O(1)` average | the same loaded collection will be queried repeatedly by id/SKU/key                     |
| Membership many times                          | `Set.has()`                                                                               | build `O(n)`, lookup `O(1)` average | repeated exact membership checks                                                        |
| One lookup in an unsorted array                | `linearFind()` / `linearFindIndex()`                                                      | `O(n)`                              | the array is small/bounded or searched only once/few times                              |
| Lookup in an already-sorted array              | `binarySearch()` / `binarySearchIndex()`                                                  | `O(log n)`                          | the collection is already sorted by the same comparator and will be searched repeatedly |
| Find duplicate/range boundaries in sorted data | `lowerBound()` / `upperBound()`                                                           | `O(log n)`                          | the same sorted order is already available                                              |
| Remove duplicates                              | `uniqueBy()`                                                                              | `O(n)` average                      | deduplicate a bounded in-memory collection; avoid nested `findIndex` patterns           |
| Count distinct values                          | `countDistinctBy()`                                                                       | `O(n)` average                      | count unique keys in an already-fetched collection, not an entire growing DB table      |
| Group by key                                   | `groupBy()`                                                                               | `O(n)` average                      | group returned bookings/rooms/accommodations by a field                                 |
| Count by key                                   | `countBy()`                                                                               | `O(n)` average                      | build counts inside a bounded returned result set                                       |
| Split by predicate                             | `partition()`                                                                             | `O(n)`                              | produce matching/non-matching groups in one pass                                        |
| Intersection/difference of two collections     | `intersectionBy()` / `differenceBy()`                                                     | `O(n + m)` average                  | compare two loaded collections; prefer `Set` to nested loops                            |
| Sum a derived number                           | `sumBy()`                                                                                 | `O(n)`                              | every loaded item must contribute to the result                                         |
| Sort loaded data                               | `sortCopy()` / `sortBy()`                                                                 | usually `O(n log n)`                | the result set is bounded and sorting cannot/should not be performed by the database    |
| Take top N from loaded data                    | `topN()`                                                                                  | currently `O(n log n)`              | only for small/bounded arrays; for large DB data, order + limit in Convex               |
| Compare theoretical growth                     | `estimateWork()`, `estimateRepeatedWork()`, `compareComplexities()`, `analyzeAlgorithm()` | analytical only                     | reasoning/tests/docs; never use these functions as a runtime query planner              |

Do not sort an unsorted array only to perform one binary search: sorting costs
`O(n log n)`, so a one-time `O(n)` linear search is normally simpler and cheaper.
Binary search earns its value when sorted order already exists or many searches
reuse it. Likewise, building a `Map` costs `O(n)` time and `O(n)` extra memory;
it is useful when repeated `O(1)` average lookups repay that build cost.

Avoid accidental quadratic work such as nested `find`, `findIndex`, `some`, or
loops over the same growing collections. When the need is exact membership,
deduplication, grouping, or joining two in-memory collections, check whether a
`Set` or `Map` can turn repeated scans into an `O(n)` or `O(n + m)` pass.
`O(n²)`, exponential, and factorial work on user/data-sized inputs require an
explicit, tiny upper bound and a reason; do not introduce them casually.

### Index decision heuristic

Do not decide whether a database column needs an index from row count alone.
Consider at least:

- `N`: rows/documents that an unbounded query could examine;
- `Q`: frequency of reads using this lookup/filter/order;
- `W`: frequency of writes that must maintain the index;
- `S`: typical selectivity, the fraction of rows/documents matched by the query.

Use `Q * N` only as a rough "scan pressure" signal: a modest table queried very
frequently can be a larger problem than a huge table queried once a day. A
useful conceptual comparison is scan work versus indexed work, approximately
`N` versus `log2(N) + matchingRows`; it is not a promise of Convex's exact
runtime or billing behavior. Indexes cost storage and write maintenance, so add
indexes for real query patterns rather than indexing every field defensively. Use
`analyzeIndex()` only as a project-local pre-check for these factors; its score
and recommendation are heuristic and never override the real Convex query shape,
index requirements, measurements, or generated Convex guidance.

A strong index candidate is a routine/hot equality, range, ordering, ownership,
or relationship lookup that materially narrows the data before it is returned.
A weak candidate is a field that is never queried, or an index added only
because the table crossed an arbitrary row threshold. Prefer compound indexes
that match actual query prefixes/order rather than several speculative indexes.
For every routine growing-list query, design the query and index together and
keep its returned range bounded.

### Complexity is a constraint, not the goal

When comparing implementations, estimate repeated work conceptually as
`Q * f(N)`, where `f(N)` is the operation's growth (`1`, `log2(N)`, `N`,
`N log2(N)`, `N²`, ...). This is a prioritization aid, not a benchmark: constants,
allocation, network/database reads, cache locality, result size, and write costs
still matter. Do not replace a clear, fast-enough implementation with a more
complex one only to obtain a better Big-O label. Measure important hot paths and
optimize the actual bottleneck. `analyzeAlgorithm()` automates this abstract
`Q * f(N)` comparison for already-loaded data; its pressure label is not a
runtime benchmark or latency prediction.

## Convex platform conventions

Use generated `Doc<'table'>` types for Convex documents. Do not derive document
types from query response items; reserve `FunctionReturnType` for query-specific
response envelopes or intentionally enriched response types.

The builders in `convexFunctionBuilders.ts` centralize identity checks, role
checks, validation, and rate limits. Storage functions expose upload URL,
metadata synchronization, and object deletion. Search suggestions use a
bounded public query. Admin routes expose account and audit-log operations.

For list queries, use the explicit cursor-list pattern: validate args with
`listPageArgs` (`src/convex/validators/listPageArgs.ts`), build one indexed page
through the owning table's page helper, enrich rows (joins, summaries) after the
fetch with the table's `enrichXPage` helpers, and attach `total` only when no
search/filters are active. Use `fetchOptimizedSearchQuery` for bounded
suggestions. Keep cursors opaque. Do not send owner ids or database predicates
from the client.

Convex rules: every function has argument and return validators; derive owner
scope from identity; check ownership on every read/update/delete; use indexes
and bounded pagination; use `ConvexError` for safe expected failures; do not
scan for routine totals or expose raw infrastructure errors. Read the generated
`src/convex/_generated/ai/guidelines.md` before changing Convex code.

The app's tables and app-facing functions are listed in
[`ProjectCodingRules.md`](./ProjectCodingRules.md).

### Translatable backend errors

Convex must return structured data, never translated text. For every new
expected client-facing failure:

1. Add its discriminated payload to `backendErrorDataSchema` in
   `src/shared/types/types.ts`. Keep `code` stable and uppercase; add structured
   values such as `maxFiles` when the message needs interpolation.
2. Throw the typed payload from Convex:

   ```ts
   throw new ConvexError<BackendErrorData>({
   	code: 'TOO_MANY_FILES',
   	maxFiles: STORAGE_CONFIG.maxFilesPerUpload
   });
   ```

   Import `BackendErrorData` with `import type`, so Convex does not bundle the
   frontend parser or Paraglide. Do not put English text or translation keys in
   the error payload.

3. Reuse a suitable shared message first. Add text under `BackendMessages` in
   `messages/en.json` only when the cause or recovery needs a custom explanation.
4. Add the matching exhaustive case in
   `src/utils/getBackendErrorMessage.ts`, passing any structured payload values
   to the Paraglide message.

No form or button needs its own code mapping. All caught mutation errors should
continue through `toastMessage({ type: 'error', error, message: fallback })`.
`toastMessage` handles rate limits first, translates recognized validated
`ConvexError` payloads centrally, and uses the caller's safe fallback for an
unknown code, malformed payload, ordinary `Error`, or infrastructure failure.

## Routes and page patterns

- `(app)/(unprotected)` contains public app screens.
- `(app)/(protected)` is reserved for authenticated screens; its server layout
  owns the authentication redirect.
- `/admin` is the admin area; its server layout owns both authentication and
  admin-role redirects.
- `/api/auth/[...all]` is the Better Auth HTTP handler. `hooks.server.ts`
  injects the Convex token and sanitizes unexpected/validation errors.

The current route map is in
[`ProjectCodingRules.md`](./ProjectCodingRules.md).

Pages should compose existing loading/error/empty states, use `SvelteHead`, and
keep each Convex query's loading/error branch local. Use SvelteKit server `load`
only for request-scoped SSR data or guards; browser Convex calls are live
subscriptions.

- When Paraglide is configured, translation keys in page child components use
  the PageName.ComponentName.key namespace and page-owned route markup uses
  PageName.key. In a project without Paraglide, ignore all translation-key
  guidance.

## Accessibility, imports, and verification

- Use semantic HTML (`button`, `a`, `form`, `ul`, `table`, `dialog`), stable
  labels, keyboard access, `aria-current`, `aria-busy`, `role="status"`/`alert`,
  and visible focus styles. Icon-only controls need an accessible label.
- Keep user-facing messages in the calling component; use `toastMessage` only
  to route success/error presentation and rate-limit timing.
- Group imports with uppercase comments (`// SVELTEKIT IMPORTS`, `// LIBRARIES`,
  `// COMPONENTS`, `// CONFIG`, `// UTILS`, `// TYPES`) and keep framework/
  library imports above local modules. Prefer `.js` suffixes for local TS
  imports and the `@/`/`@convex` aliases. Normalize old direct default
  primitive imports to barrel named imports when touching that file.
- After every change run `bunx --bun oxlint`. For Convex or pagination changes,
  also run `bun run check` and `npx convex dev --once`; run
  `bun run test:convex` for the relevant behavior.
