/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { expect, test } from 'vitest';
import { internal } from '../../src/convex/betterAuth/component/_generated/api';
import schema from '../../src/convex/betterAuth/component/schema';

const modules = import.meta.glob('../../src/convex/betterAuth/component/**/*.ts');
const migration = internal.migrations.removeUserPaypalFields.removeUserPaypalFields;
const legacySchema = defineSchema({
	...schema.tables,
	user: defineTable({
		...schema.tables.user.validator.fields,
		paypalEnvironment: v.optional(v.union(v.null(), v.string())),
		paypalMerchantId: v.optional(v.union(v.null(), v.string())),
		paypalTrackingId: v.optional(v.union(v.null(), v.string())),
		paypalWebhookAt: v.optional(v.union(v.null(), v.number()))
	})
});

test('removes only legacy PayPal fields across pages and can be rerun safely', async () => {
	const t = convexTest(legacySchema, modules);
	const retained = {
		name: 'Host',
		email: 'host@example.com',
		emailVerified: true,
		createdAt: 123,
		updatedAt: 456,
		role: 'admin',
		banned: false,
		payoutsEnabled: true
	};
	const ids = await t.run(async (ctx) => {
		const users = [];
		for (let i = 0; i < 101; i += 1) {
			users.push(
				await ctx.db.insert('user', {
					...retained,
					paypalEnvironment: 'sandbox',
					paypalMerchantId: 'legacy-merchant',
					paypalTrackingId: 'legacy-tracking',
					paypalWebhookAt: i === 0 ? null : 789
				})
			);
		}
		users.push(await ctx.db.insert('user', retained));
		return users;
	});
	const before = await t.run((ctx) => Promise.all(ids.map((id) => ctx.db.get('user', id))));

	const first = await t.mutation(migration, { cursor: null });
	expect(first).toMatchObject({ processed: 100, migrated: 100 });
	expect(first.nextCursor).not.toBeNull();
	const last = await t.mutation(migration, { cursor: first.nextCursor });
	expect(last).toEqual({ processed: 2, migrated: 1, nextCursor: null });

	const after = await t.run((ctx) => Promise.all(ids.map((id) => ctx.db.get('user', id))));
	for (const [index, user] of after.entries()) {
		const expected = Object.fromEntries(
			Object.entries(before[index] ?? {}).filter(([key]) => !key.startsWith('paypal'))
		);
		expect(user).toEqual(expected);
	}
	expect(await t.mutation(migration, { cursor: null })).toMatchObject({ migrated: 0 });
});
