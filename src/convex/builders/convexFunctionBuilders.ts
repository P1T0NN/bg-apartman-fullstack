// LIBRARIES
import {
	customAction,
	customCtx,
	customCtxAndArgs,
	customMutation,
	customQuery
} from 'convex-helpers/server/customFunctions';
import {
	action as rawAction,
	internalMutation as rawInternalMutation,
	mutation as rawMutation,
	query as rawQuery,
	type ActionCtx,
	type MutationCtx,
	type QueryCtx
} from '../_generated/server.js';
import { ConvexError, v } from 'convex/values';

// AUTH
import {
	getOwnerId,
	requireAdminIdentity,
	requireIdentity
} from '../betterAuth/helpers/requireIdentity.js';
import { enforceRateLimit } from '../rateLimits/helpers/enforceRateLimit.js';

// STORAGE
import { getUploadByKey } from '../storage/getUploadByKey.js';

// CONFIG
import { STORAGE_CONFIG } from '../../shared/features/storage/config.js';

// UTILS
import { countDistinctBy } from '../../shared/lib/algorithms/index.js';

// TYPES
import type { Doc } from '../_generated/dataModel.js';
import type { RateLimitedFunctionOptions } from '../rateLimits/types/rateLimitTypes.js';
import type { BackendErrorData } from '../../shared/types/types.js';

/** Transport arg Form sends so anonymous limits can key on the browser guest id. */
const guestIdArgs = { guestId: v.optional(v.string()) };

const publicMutationContext = customCtxAndArgs({
	args: guestIdArgs,
	input: async (
		ctx: MutationCtx,
		args: { guestId?: string },
		options: RateLimitedFunctionOptions
	) => {
		const rateLimitOk = await enforceRateLimit(ctx, options.rateLimit, undefined, args.guestId);
		return { ctx: { rateLimitOk }, args: {} };
	}
});

const publicActionContext = customCtxAndArgs({
	args: guestIdArgs,
	input: async (
		ctx: ActionCtx,
		args: { guestId?: string },
		options: RateLimitedFunctionOptions
	) => {
		const rateLimitOk = await enforceRateLimit(ctx, options.rateLimit, undefined, args.guestId);
		return { ctx: { rateLimitOk }, args: {} };
	}
});

const authenticatedMutationContext = customCtxAndArgs({
	args: guestIdArgs,
	input: async (
		ctx: MutationCtx,
		_args: { guestId?: string },
		options: RateLimitedFunctionOptions
	) => {
		const identity = await requireIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);
		return { ctx: { identity }, args: {} };
	}
});

const authenticatedActionContext = customCtxAndArgs({
	args: guestIdArgs,
	input: async (
		ctx: ActionCtx,
		_args: { guestId?: string },
		options: RateLimitedFunctionOptions
	) => {
		const identity = await requireIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);
		return { ctx: { identity }, args: {} };
	}
});

const authenticatedQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireIdentity(ctx)
}));

const adminMutationContext = customCtxAndArgs({
	args: guestIdArgs,
	input: async (
		ctx: MutationCtx,
		_args: { guestId?: string },
		options: RateLimitedFunctionOptions
	) => {
		const identity = await requireAdminIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);
		return { ctx: { identity }, args: {} };
	}
});

const adminQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireAdminIdentity(ctx)
}));

export const mutation = customMutation(rawMutation, publicMutationContext);
export const action = customAction(rawAction, publicActionContext);
export const authenticatedMutation = customMutation(rawMutation, authenticatedMutationContext);
const authenticatedUploadContext = (rateLimited: boolean) => ({
	args: {
		uploadedFiles: v.optional(v.array(v.string())),
		retainedFiles: v.optional(v.array(v.string())),
		guestId: v.optional(v.string())
	},
	input: async (
		ctx: MutationCtx,
		args: { uploadedFiles?: string[]; retainedFiles?: string[]; guestId?: string },
		options: RateLimitedFunctionOptions
	) => {
		const identity = await requireIdentity(ctx);
		if (rateLimited) await enforceRateLimit(ctx, options.rateLimit, identity);
		const authenticated = { db: ctx.db, identity };
		const keys = args.uploadedFiles;
		if (keys && keys.length > STORAGE_CONFIG.maxFilesPerUpload) {
			throw new ConvexError<BackendErrorData>({
				code: 'TOO_MANY_FILES',
				maxFiles: STORAGE_CONFIG.maxFilesPerUpload
			});
		}
		const hasDuplicateKeys =
			keys !== undefined && countDistinctBy(keys, (key) => key) !== keys.length;

		if (hasDuplicateKeys) {
			throw new ConvexError<BackendErrorData>({ code: 'DUPLICATE_UPLOAD_KEY' });
		}

		const uploads: Doc<'storageUploads'>[] = [];
		for (const key of keys ?? []) {
			const upload = await getUploadByKey(ctx, key);
			if (
				!upload ||
				upload.ownerId !== getOwnerId(authenticated.identity) ||
				upload.status !== 'uploaded'
			) {
				throw new ConvexError<BackendErrorData>({ code: 'UPLOAD_NOT_FOUND' });
			}
			uploads.push(upload);
		}

		return {
			ctx: authenticated,
			args: {
				uploadedFiles: keys ?? null,
				retainedFiles: args.retainedFiles ?? null
			},
			onSuccess: async () => {
				for (const upload of uploads) await ctx.db.delete('storageUploads', upload._id);
			}
		};
	}
});

export const authenticatedUploadMutation = customMutation(
	rawMutation,
	authenticatedUploadContext(true)
);
export const authenticatedUploadInternalMutation = customMutation(
	rawInternalMutation,
	authenticatedUploadContext(false)
);
export const authenticatedAction = customAction(rawAction, authenticatedActionContext);
export const authenticatedQuery = customQuery(rawQuery, authenticatedQueryContext);
export const adminMutation = customMutation(rawMutation, adminMutationContext);
export const adminQuery = customQuery(rawQuery, adminQueryContext);

export const internalMutation = rawInternalMutation;
