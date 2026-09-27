/// <reference types="vite/client" />

import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';

import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

test('returns only case-insensitive prefix suggestions after two characters', async () => {
	const t = convexTest(schema, modules);

	await expect(
		t.query(api.search.queries.fetchSearchSuggestions.fetchSearchSuggestions, { search: 't' })
	).resolves.toEqual([]);

	const suggestions = await t.query(
		api.search.queries.fetchSearchSuggestions.fetchSearchSuggestions,
		{ search: 'TA' }
	);

	expect(suggestions).toHaveLength(7);
	expect(suggestions[0]).toEqual({ id: 'tapuskovic', label: 'Tapuskovic' });
	expect(
		await t.query(api.search.queries.fetchSearchSuggestions.fetchSearchSuggestions, {
			search: 'vic'
		})
	).toEqual([]);
});
