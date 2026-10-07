// LIBRARIES
import { vEmailId } from '@convex-dev/resend';
import { literals } from 'convex-helpers/validators';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// CONFIG
import { ACCOMMODATION_CONFIG } from '../../../shared/features/accommodations/config.js';
import { BOOKING_STATUSES } from '../../../shared/features/bookings/data/bookingsData.js';

// SCHEMAS
import { accommodations } from '../accommodations/schema.js';

/** Server-owned terms frozen when the request is submitted, never reconstructed from a listing. */
export const bookingCancellationTerms = v.object({
	policy: accommodations.validator.fields.cancellationPolicy,
	timeZone: v.string(),
	checkInStart: v.string(),
	checkInAt: v.number(),
	checkOut: v.string(),
	checkOutAt: v.number(),
	pricePerNightMinor: v.number(),
	basePricePerNightMinor: v.number(),
	discountBps: v.number(),
	stayPricing: v.object({
		regularNights: v.number(),
		weekendNights: v.number(),
		weekendBasePricePerNightMinor: v.union(v.number(), v.null()),
		weekendPricePerNightMinor: v.union(v.number(), v.null()),
		totalMinor: v.number()
	}),
	// Backfilled overnight stays have no day-use fee; daytime bookings freeze their own fee.
	stayType: literals('overnight', 'day_use'),
	pricePerDayUseMinor: v.union(v.number(), v.null()),
	currency: v.string()
});

export const cancellationRefundPercentage = v.union(
	...ACCOMMODATION_CONFIG.CANCELLATION_REFUND_PERCENTAGES.map((percentage) =>
		v.literal(percentage)
	),
	v.null()
);

export const bookingEmailIds = v.object({
	guest: v.optional(vEmailId),
	host: v.optional(vEmailId)
});

export const bookingCancellation = v.object({
	actor: v.literal('guest'),
	cancelledBy: v.string(),
	cancelledAt: v.number(),
	reason: v.string(),
	kind: literals('withdrawal', 'cancellation'),
	// Withdrawals have no accepted refund policy; confirmed cancellations preserve the outcome.
	refundPercentage: cancellationRefundPercentage,
	emailIds: v.optional(bookingEmailIds)
});

export const bookings = defineTable({
	/** Immutable commission snapshot. Null identifies historical bookings with unknown terms. */
	platformFeeTerms: v.union(
		v.null(),
		v.object({
			model: literals('booking_fee', 'flat_fee', 'free'),
			commissionBps: v.number(),
			baseAmountMinor: v.number(),
			amountMinor: v.number(),
			currency: v.string()
		})
	),
	// Immutable choice at booking time; absent on historical request bookings.
	paymentMethod: v.union(v.literal('cash'), v.literal('online')),
	bookingMode: accommodations.validator.fields.bookingMode,
	// Optional for existing records; the cron initializes legacy pending deadlines in batches.
	requestExpiresAt: v.optional(v.number()),
	expiredAt: v.optional(v.number()),
	// Present for guest cancellations; active and historical host-cancelled bookings have no record.
	cancellation: v.optional(bookingCancellation),
	// Set server-side when a signed-in guest books; also used to claim anonymous bookings.
	ownerId: v.optional(v.string()),
	// Owner of the booked accommodation, copied at creation; powers the host bookings page.
	hostId: v.optional(v.string()),
	// Requests start pending; instant bookings start confirmed.
	status: literals(...BOOKING_STATUSES),
	/** Immutable property-local terms for every booking, backfilled before becoming required. */
	cancellationTerms: bookingCancellationTerms,
	// Retained even when a review is moderated: each stay earns only one review.
	reviewId: v.optional(v.id('reviews')),
	completedAt: v.optional(v.number()),
	completedBy: v.optional(v.string()),
	completionNote: v.optional(v.string()),
	// Lowercased "<lastName> <email>" maintained by booking writes; powers guest search.
	searchText: v.optional(v.string()),
	accommodationId: v.id('accommodations'),
	firstName: v.string(),
	lastName: v.string(),
	// Trimmed and lowercased; recovery lookup uses exact indexed matching.
	email: v.string(),
	phone: v.string(),
	specialRequests: v.optional(v.string()),
	checkInDate: v.string(), // ISO date, e.g. "2026-10-01".
	checkOutDate: v.string(), // ISO date, e.g. "2026-10-05"; the departure day.
	adults: v.number(),
	children: v.number()
})
	.index('by_email_check_out_date', ['email', 'checkOutDate'])
	.index('by_email_status', ['email', 'status'])
	.index('by_status_request_expires_at', ['status', 'requestExpiresAt'])
	.index('by_accommodation_id_status_check_out_at', [
		'accommodationId',
		'status',
		'cancellationTerms.checkOutAt'
	])
	// Retained for _creationTime ordering; guest list queries sort newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_owner_id', ['ownerId'])
	.index('by_owner_id_status', ['ownerId', 'status'])
	.index('by_owner_id_accommodation_id_status_review_id_check_out_at', [
		'ownerId',
		'accommodationId',
		'status',
		'reviewId',
		'cancellationTerms.checkOutAt'
	])
	// Retained for _creationTime ordering; host list queries sort newest first.
	// eslint-disable-next-line @convex-dev/no-duplicate-indexes
	.index('by_host_id', ['hostId'])
	.index('by_host_id_status', ['hostId', 'status'])
	.searchIndex('search_guest', {
		searchField: 'searchText',
		filterFields: ['ownerId', 'hostId', 'status']
	});
