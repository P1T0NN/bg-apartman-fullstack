/// <reference types="vite/client" />

import aggregateTest from '@convex-dev/aggregate/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import { api } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function setup() {
	const t = convexTest(schema, modules);
	aggregateTest.register(t, 'feedbacksAggregate');
	rateLimiterTest.register(t);
	return t;
}

const createFeedback = api.tables.feedbacks.mutations.createFeedback.createFeedback;
const updateFeedbackStatus =
	api.tables.feedbacks.mutations.updateFeedbackStatus.updateFeedbackStatus;
const fetchFeedbacksAdmin = api.tables.feedbacks.queries.fetchFeedbacksAdmin.fetchFeedbacksAdmin;

test('feedback captures guest and signed-in submitters and stays filterable', async () => {
	const t = setup();

	await expect(
		t.mutation(createFeedback, {
			type: 'bug',
			category: 'other',
			title: 'x',
			message: 'too short'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_FEEDBACK' } });

	await t.mutation(createFeedback, {
		type: 'bug',
		category: 'booking',
		title: 'Booking button does nothing',
		message: 'On the search page the book button does nothing on mobile.'
	});
	await t.mutation(createFeedback, {
		type: 'question',
		category: 'account',
		title: 'How do I change my email?',
		message: 'I cannot find where to change the email on my account.',
		email: 'guest@example.com'
	});

	const member = t.withIdentity({
		subject: 'user-1',
		tokenIdentifier: 'issuer|user-1',
		name: 'Jane Doe',
		email: 'jane@example.com'
	});
	await member.mutation(createFeedback, {
		type: 'question',
		category: 'payment',
		title: 'Card declined',
		message: 'My card was declined but I was still charged.'
	});

	const stored = await t.run((ctx) => ctx.db.query('feedbacks').take(10));
	expect(stored).toHaveLength(3);
	expect(stored[0]).toMatchObject({ type: 'bug', status: 'unresolved' });
	expect(stored[0].userId).toBeUndefined();
	expect(stored[0].email).toBeUndefined();
	expect(stored[1]).toMatchObject({ type: 'question', email: 'guest@example.com' });
	expect(stored[1].userId).toBeUndefined();
	expect(stored[2]).toMatchObject({
		userId: 'user-1',
		userName: 'Jane Doe',
		userEmail: 'jane@example.com'
	});

	const admin = t.withIdentity({
		subject: 'admin',
		tokenIdentifier: 'issuer|admin',
		role: 'admin'
	});

	await expect(
		member.mutation(updateFeedbackStatus, { id: stored[0]._id, status: 'resolved' })
	).rejects.toMatchObject({ data: { code: 'FORBIDDEN' } });

	await admin.mutation(updateFeedbackStatus, { id: stored[0]._id, status: 'resolved' });
	const resolved = await t.run((ctx) => ctx.db.get(stored[0]._id));
	expect(resolved?.status).toBe('resolved');
	expect(resolved?.resolvedAt).toBeTypeOf('number');

	await admin.mutation(updateFeedbackStatus, { id: stored[0]._id, status: 'unresolved' });
	const reopened = await t.run((ctx) => ctx.db.get(stored[0]._id));
	expect(reopened?.status).toBe('unresolved');
	expect(reopened?.resolvedAt).toBeUndefined();

	const base = { paginationOpts: { cursor: null, numItems: 10 } };

	const all = await admin.query(fetchFeedbacksAdmin, base);
	expect(all.total).toBe(3);

	const bugs = await admin.query(fetchFeedbacksAdmin, { ...base, filters: { type: 'bug' } });
	expect(bugs.items.map((item) => item.title)).toEqual(['Booking button does nothing']);

	const accountQuestion = await admin.query(fetchFeedbacksAdmin, {
		...base,
		filters: { type: 'question', category: 'account' }
	});
	expect(accountQuestion.items.map((item) => item.title)).toEqual(['How do I change my email?']);

	const search = await admin.query(fetchFeedbacksAdmin, { ...base, search: 'declined' });
	expect(search.items.map((item) => item.title)).toEqual(['Card declined']);

	const scopedSearch = await admin.query(fetchFeedbacksAdmin, {
		...base,
		search: 'email',
		filters: { category: 'account' }
	});
	expect(scopedSearch.items.map((item) => item.title)).toEqual(['How do I change my email?']);
});

test('signed-in callers are keyed by identity on a public mutation, not by guest id', async () => {
	const t = setup();
	const guestId = 'shared-browser';
	const feedbackArgs = () => ({
		type: 'bug' as const,
		category: 'other' as const,
		title: 'Broken page',
		message: 'The page fails to load every time I open it.',
		guestId
	});

	// Exhaust the anonymous bucket for this browser (capacity 10).
	for (let i = 0; i < 10; i++) {
		await t.mutation(createFeedback, feedbackArgs());
	}
	await expect(t.mutation(createFeedback, feedbackArgs())).rejects.toMatchObject({
		data: { kind: 'RateLimited' }
	});

	// The same browser signed in uses its identity bucket, so it is not throttled.
	const member = t.withIdentity({ subject: 'user-1', tokenIdentifier: 'issuer|user-1' });
	await expect(member.mutation(createFeedback, feedbackArgs())).resolves.toBeNull();
});
