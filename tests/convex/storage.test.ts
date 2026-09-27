/// <reference types="vite/client" />

import actionRetrierTest from '@convex-dev/action-retrier/test';
import r2Test from '@convex-dev/r2/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import auditLogTest from 'convex-audit-log/test';
import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';

import { api, internal } from '../../src/convex/_generated/api';
import schema from '../../src/convex/schema';
import { detectImageContentType } from '../../src/convex/storage/r2';
import { STORAGE_CONFIG } from '../../src/shared/features/storage/config';

const modules = import.meta.glob('../../src/convex/**/*.ts');

function createTestContext() {
	const t = convexTest(schema, modules);
	r2Test.register(t);
	actionRetrierTest.register(t, 'r2/actionRetrier');
	rateLimiterTest.register(t);
	auditLogTest.register(t);
	return t;
}

test('tracks uploads under the owner who requested them', async () => {
	const t = createTestContext();
	const owner = t.withIdentity({ tokenIdentifier: 'upload-owner', subject: 'upload-owner' });
	const otherOwner = t.withIdentity({ tokenIdentifier: 'other-owner', subject: 'other-owner' });
	const generated = await owner.mutation(api.storage.r2.generateUploadUrl, {
		size: 12,
		contentType: 'image/webp'
	});
	const trackedUpload = await t.run((ctx) =>
		ctx.db
			.query('storageUploads')
			.withIndex('by_key', (query) => query.eq('key', generated.key))
			.unique()
	);

	expect(generated.key).toMatch(/^[0-9a-f-]{36}$/);
	expect(generated.url).toContain('test-account.r2.cloudflarestorage.com');
	expect(trackedUpload).toMatchObject({ ownerId: 'upload-owner', status: 'pending' });
	await expect(
		otherOwner.action(api.storage.r2.syncMetadata, { key: generated.key })
	).resolves.toBe(false);
});

test('generates namespaced R2 keys and deletes them by their full key', async () => {
	const t = createTestContext();
	const owner = t.withIdentity({
		tokenIdentifier: 'namespaced-upload-owner',
		subject: 'namespaced-upload-owner'
	});
	const generated = await owner.mutation(api.storage.r2.generateUploadUrl, {
		namespace: 'accommodations/images',
		size: 12,
		contentType: 'image/webp'
	});

	expect(generated.key).toMatch(/^accommodations\/images\/[0-9a-f-]{36}$/);
	await owner.mutation(api.storage.r2.deleteObject, { key: generated.key });
	expect(
		await t.run((ctx) =>
			ctx.db
				.query('storageUploads')
				.withIndex('by_key', (query) => query.eq('key', generated.key))
				.unique()
		)
	).toBeNull();

	await expect(
		owner.mutation(api.storage.r2.generateUploadUrl, {
			namespace: '../accommodations',
			size: 12,
			contentType: 'image/webp'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_UPLOAD_NAMESPACE' } });
});

test('rejects oversized or disguised uploads', async () => {
	const t = createTestContext();
	const owner = t.withIdentity({
		tokenIdentifier: 'upload-validator',
		subject: 'upload-validator'
	});

	await expect(
		owner.mutation(api.storage.r2.generateUploadUrl, {
			size: STORAGE_CONFIG.maxFileSizeBytes + 1,
			contentType: 'image/png'
		})
	).rejects.toMatchObject({ data: { code: 'INVALID_UPLOAD' } });
	expect(detectImageContentType(new Uint8Array([0xff, 0xd8, 0xff]))).toBe('image/jpeg');
	expect(detectImageContentType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeUndefined();
});

test('removes pending uploads after their owner is deleted', async () => {
	const t = createTestContext();
	const ownerId = 'deleted-owner';
	const uploadId = await t.run((ctx) =>
		ctx.db.insert('storageUploads', {
			ownerId,
			key: 'deleted-owner-upload',
			status: 'pending',
			createdAt: Date.now()
		})
	);

	await t.mutation(internal.betterAuth.cleanupDeletedUserData.cleanupDeletedUserData, { ownerId });

	expect(await t.run((ctx) => ctx.db.get(uploadId))).toBeNull();
});
