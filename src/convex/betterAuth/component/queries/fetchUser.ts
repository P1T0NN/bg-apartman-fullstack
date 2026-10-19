// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { query } from '../_generated/server.js';

const adminUser = v.object({
	id: v.string(),
	name: v.string(),
	email: v.string(),
	emailVerified: v.boolean(),
	payoutsEnabled: v.boolean(),
	image: v.union(v.null(), v.string()),
	role: v.string(),
	banned: v.boolean(),
	banReason: v.union(v.null(), v.string()),
	banExpires: v.union(v.null(), v.number()),
	userId: v.union(v.null(), v.string()),
	createdAt: v.number(),
	updatedAt: v.number()
});

export const fetchUser = query({
	args: { id: v.string() },
	returns: v.union(v.null(), adminUser),
	handler: async (ctx, args) => {
		const id = ctx.db.normalizeId('user', args.id);
		if (!id) return null;
		const user = await ctx.db.get('user', id);
		if (!user) return null;

		return {
			id: String(user._id),
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			payoutsEnabled: user.payoutsEnabled === true,
			image: user.image ?? null,
			role: user.role ?? 'user',
			banned: user.banned ?? false,
			banReason: user.banReason ?? null,
			banExpires: user.banExpires ?? null,
			userId: user.userId ?? null,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		};
	}
});
