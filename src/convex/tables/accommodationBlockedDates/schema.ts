// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** A row represents one manually blocked property-local night. Missing rows are unblocked. */
export const accommodationBlockedDates = defineTable({
	accommodationId: v.id('accommodations'),
	date: v.string()
}).index('by_accommodation_id_date', ['accommodationId', 'date']);
