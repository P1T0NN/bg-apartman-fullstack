/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api } from '../../src/convex/betterAuth/component/_generated/api';
import schema from '../../src/convex/betterAuth/component/schema';

const modules = import.meta.glob('../../src/convex/betterAuth/component/**/*.ts');

test('user lookup handles seeded, malformed and missing owners without breaking public listings', async () => {
	const t = convexTest(schema, modules);
	const fetchUser = api.queries.fetchUser.fetchUser;
	for (const id of ['seed-owner', '', 'not-a-user-id'])
		expect(await t.query(fetchUser, { id })).toBeNull();
	const id = await t.run((ctx) =>
		ctx.db.insert('user', {
			name: 'Host',
			email: 'host@example.com',
			emailVerified: true,
			payoutsEnabled: true,
			createdAt: 123,
			updatedAt: 456
		})
	);
	expect(await t.query(fetchUser, { id })).toMatchObject({ id, payoutsEnabled: true });
	await t.run((ctx) => ctx.db.delete('user', id));
	expect(await t.query(fetchUser, { id })).toBeNull();
});
