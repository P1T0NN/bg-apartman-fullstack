// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const bookings = defineTable({
	// Set server-side when a guest booking is claimed by a signed-in user.
	ownerId: v.optional(v.string()),
	// Lowercased "<lastName> <email>" maintained by booking writes; powers guest search.
	searchText: v.optional(v.string()),
	accommodationId: v.id('accommodations'),
	firstName: v.string(),
	lastName: v.string(),
	email: v.string(),
	phone: v.string(),
	specialRequests: v.optional(v.string()),
	checkInDate: v.string(), // ISO date, e.g. "2026-10-01".
	checkOutDate: v.string(), // ISO date, e.g. "2026-10-05"; the departure day.
	adults: v.number(),
	children: v.number()
})
	.index('by_owner_id', ['ownerId'])
	.searchIndex('search_guest', { searchField: 'searchText', filterFields: ['ownerId'] });
