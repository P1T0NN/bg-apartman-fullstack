// LIBRARIES
import assert from 'node:assert/strict';
import { ConvexHttpClient } from 'convex/browser';

// CONVEX
import { api } from '../src/convex/_generated/api.js';

// Run with bun --env-file=.env.local scripts/check-search-pagination.ts against seeded development data.
const url = process.env.PUBLIC_CONVEX_URL;
assert(url, 'PUBLIC_CONVEX_URL is required.');
const client = new ConvexHttpClient(url);

// convex-test does not check cursor/query fingerprints; use the real read-only endpoints.
for (const query of [
	api.tables.accommodations.queries.fetchAccommodationsSearch.fetchAccommodationsSearch,
	api.tables.accommodations.queries.fetchAccommodationsMapSearch.fetchAccommodationsMap
]) {
	const args = {
		location: { country: 'Serbia' },
		paginationOpts: { cursor: null, numItems: 1, maximumRowsRead: 2 }
	};
	const first = await client.query(query, args);
	assert(first.items.length > 0, 'Seeded development listings must be publicly visible.');
	assert(first.nextCursor, 'Seed enough accommodations to produce a second page.');
	const second = await client.query(query, {
		...args,
		paginationOpts: { ...args.paginationOpts, cursor: first.nextCursor }
	});
	assert(second.items.length > 0, 'The next page must also return visible listings.');
	assert.notEqual(second.nextCursor, first.nextCursor, 'Pagination must advance.');
}
console.log('List and map continuation cursors remain valid across consecutive requests.');
