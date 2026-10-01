// LIBRARIES
import { literals } from 'convex-helpers/validators';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// CONFIG
import {
	FEEDBACK_CATEGORIES,
	FEEDBACK_TYPES
} from '../../../shared/features/feedbacks/schemas/feedbackSchemas.js';

export const feedbacks = defineTable({
	// Snapshot of the signed-in submitter; absent for guest feedback.
	userId: v.optional(v.string()),
	userName: v.optional(v.string()),
	userEmail: v.optional(v.string()),
	type: literals(...FEEDBACK_TYPES),
	category: literals(...FEEDBACK_CATEGORIES),
	title: v.string(),
	message: v.string(),
	// Guest contact address, used when no signed-in user is attached.
	email: v.optional(v.string()),
	status: literals('unresolved', 'resolved'),
	resolvedAt: v.optional(v.number()),
	// Lowercased "<title> <message>" maintained by feedback writes; powers admin search.
	searchText: v.string()
})
	// Retained for _creationTime ordering; the admin list sorts newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_type', ['type'])
	.index('by_category', ['category'])
	.index('by_type_category', ['type', 'category'])
	.searchIndex('search_feedback', {
		searchField: 'searchText',
		filterFields: ['type', 'category']
	});
