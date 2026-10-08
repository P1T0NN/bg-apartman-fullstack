/// <reference types="vite/client" />

import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');
const fetchMyBenefits = api.tables.loyaltyMemberships.queries.fetchMyBenefits.fetchMyBenefits;

test('benefits require authentication and expose only the signed-in guest membership', async () => {
	const t = convexTest(schema, modules);
	const membershipId = await t.run((ctx) =>
		ctx.db.insert('loyaltyMemberships', {
			ownerId: 'guest',
			qualifyingStays: 3,
			joinedAt: 1000
		})
	);
	await expect(t.query(fetchMyBenefits, {})).rejects.toThrow();
	const guest = t.withIdentity({ subject: 'guest', tokenIdentifier: 'issuer|guest' });
	const stranger = t.withIdentity({ subject: 'stranger', tokenIdentifier: 'issuer|stranger' });
	expect(await guest.query(fetchMyBenefits, {})).toEqual({
		level: 0,
		qualifyingStays: 3,
		joinedAt: 1000
	});
	expect(await stranger.query(fetchMyBenefits, {})).toEqual({
		level: 0,
		qualifyingStays: 0,
		joinedAt: null
	});
	await t.run((ctx) => ctx.db.patch('loyaltyMemberships', membershipId, { level: 2 }));
	expect(await guest.query(fetchMyBenefits, {})).toEqual({
		level: 2,
		qualifyingStays: 3,
		joinedAt: 1000
	});
});

test('account cleanup removes only that account membership and can be retried', async () => {
	const t = convexTest(schema, modules);
	await t.run(async (ctx) => {
		for (const ownerId of ['guest', 'stranger']) {
			await ctx.db.insert('loyaltyMemberships', { ownerId, qualifyingStays: 1, joinedAt: 1000 });
		}
	});
	for (let attempt = 0; attempt < 2; attempt++) {
		await t.mutation(internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData, {
			ownerId: 'guest'
		});
	}
	const owners = await t.run(async (ctx) =>
		(await ctx.db.query('loyaltyMemberships').take(3)).map((membership) => membership.ownerId)
	);
	expect(owners).toEqual(['stranger']);
});
