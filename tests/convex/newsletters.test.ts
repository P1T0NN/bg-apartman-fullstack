/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'newslettersAggregate');
	return t;
}

const subscribe =
	internal.tables.newsletters.mutations.upsertNewsletterSubscriber.upsertNewsletterSubscriber;
const fetchAdmin = api.tables.newsletters.queries.fetchNewslettersAdmin.fetchNewslettersAdmin;

test('re-subscribing is an idempotent upsert that keeps the total exact', async () => {
	const t = setup();
	const admin = t.withIdentity({
		subject: 'admin',
		tokenIdentifier: 'issuer|admin',
		role: 'admin'
	});

	await expect(
		t.query(fetchAdmin, { paginationOpts: { cursor: null, numItems: 10 } })
	).rejects.toMatchObject({ data: { code: 'UNAUTHENTICATED' } });

	await t.mutation(subscribe, { email: 'guest@example.com' });
	await t.mutation(subscribe, { email: 'guest@example.com' });
	await t.mutation(subscribe, { email: 'other@example.com' });

	expect(await t.run((ctx) => ctx.db.query('newsletters').take(10))).toHaveLength(2);

	const page = await admin.query(fetchAdmin, {
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(page.total).toBe(2);
	expect(page.items).toHaveLength(2);

	const search = await admin.query(fetchAdmin, {
		search: 'other',
		paginationOpts: { cursor: null, numItems: 10 }
	});
	expect(search.items.map((item) => item.email)).toEqual(['other@example.com']);
	expect(search.total).toBeUndefined();
});
