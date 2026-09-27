// LIBRARIES
import {
	customAction,
	customCtx,
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

const publicMutationContext = customCtx(
	async (ctx: MutationCtx, options: RateLimitedFunctionOptions) => {
		const rateLimitOk = await enforceRateLimit(ctx, options.rateLimit);
		return { rateLimitOk };
	}
);

const publicActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		const rateLimitOk = await enforceRateLimit(ctx, options.rateLimit);
		return { rateLimitOk };
	}
);

const getAuthenticatedMutationContext = async (
	ctx: MutationCtx,
	options: RateLimitedFunctionOptions
) => {
	const identity = await requireIdentity(ctx);
	await enforceRateLimit(ctx, options.rateLimit, identity);
	return { identity };
};

const authenticatedMutationContext = customCtx(getAuthenticatedMutationContext);

const authenticatedActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);

		return { identity };
	}
);

const authenticatedQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireIdentity(ctx)
}));

const adminMutationContext = customCtx(
	async (ctx: MutationCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireAdminIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);
		return { identity };
	}
);

const adminQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireAdminIdentity(ctx)
}));

export const mutation = customMutation(rawMutation, publicMutationContext);
export const action = customAction(rawAction, publicActionContext);
export const authenticatedMutation = customMutation(rawMutation, authenticatedMutationContext);
const authenticatedUploadContext = (rateLimited: boolean) => ({
	args: {
		uploadedFiles: v.optional(v.array(v.string())),
		retainedFiles: v.optional(v.array(v.string()))
	},
	input: async (
		ctx: MutationCtx,
		args: { uploadedFiles?: string[]; retainedFiles?: string[] },
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
				for (const upload of uploads) await ctx.db.delete(upload._id);
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
