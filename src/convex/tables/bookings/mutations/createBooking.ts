// LIBRARIES
import { MINUTE } from '@convex-dev/rate-limiter';
import { ConvexError, v } from 'convex/values';

// CONVEX
import { components } from '../../../_generated/api.js';

// BUILDERS
import { mutation } from '../../../builders/convexFunctionBuilders.js';

// AGGREGATES
import { bookingOwnerAggregate } from '../aggregates/bookingOwnerAggregate.js';

// AUTH
import { getOwnerId } from '../../../betterAuth/helpers/requireIdentity.js';

// EMAILS
import { sendBookingRequestEmail } from '../emails/sendBookingRequestEmail.js';
import { sendBookingConfirmationEmail } from '../emails/sendBookingConfirmationEmail.js';
import { checkBookingAvailability } from '../helpers/checkBookingAvailability.js';
import { getBookingBenefitsContext } from '../../loyaltyMemberships/helpers/getBookingBenefitsContext.js';
import { loyaltyBookingBenefitsValidator } from '../../loyaltyMemberships/validators/loyaltyBenefitsValidators.js';
import { accommodations } from '../../accommodations/schema.js';

// SCHEMAS
import { createBookingSchema } from '../../../../shared/features/bookings/schemas/bookingSchemas.js';
import { timeZoneSchema } from '../../../../shared/features/timezone/schemas/timezoneSchemas.js';
import { recordedCancellationPolicySchema } from '../../../../shared/features/accommodations/schemas/cancellationPolicySchemas.js';
import { ACCOMMODATION_CONFIG } from '../../../../shared/features/accommodations/config.js';

// CONFIG
import { COMPANY_DATA } from '../../../../shared/config.js';
import { BOOKINGS_CONFIG } from '../../../../shared/features/bookings/config.js';

// UTILS
import { calculateLoyaltyQuote } from '../../../../shared/features/loyalty/utils/calculateLoyaltyQuote.js';
import { areLoyaltyBenefitsEqual } from '../../../../shared/features/loyalty/utils/areLoyaltyBenefitsEqual.js';
import { calculateBookingPlatformFee } from '../../../../shared/features/bookings/utils/calculateBookingPlatformFee.js';
import { getIsoDateInTimeZone } from '../../../../shared/features/timezone/utils/getIsoDateInTimeZone.js';
import { getZonedTimestamp } from '../../../../shared/features/timezone/utils/getZonedTimestamp.js';

// UTILS
import { isAccommodationVisible } from '../../../../shared/features/accommodations/utils/isAccommodationVisible.js';

// TYPES
import type { BackendErrorData } from '../../../../shared/types/types.js';

/** Public reservation: the stored listing chooses approval or instant confirmation; no payment is taken. */
export const createBooking = mutation({
	rateLimit: {
		name: 'bookings:create',
		config: { kind: 'token bucket', rate: 10, period: MINUTE, capacity: 5 }
	},
	args: {
		paymentMethod: v.union(v.literal('cash'), v.literal('online')),
		accommodationId: v.id('accommodations'),
		expectedBookingMode: v.optional(v.union(v.literal('request'), v.literal('instant'))),
		expectedPricePerNightMinor: v.number(),
		expectedTotalMinor: v.number(),
		expectedCancellationPolicy: accommodations.validator.fields.cancellationPolicy,
		expectedLoyaltyBenefits: v.optional(v.union(loyaltyBookingBenefitsValidator, v.null())),
		checkInDate: v.string(),
		checkOutDate: v.string(),
		adults: v.number(),
		children: v.number(),
		firstName: v.string(),
		lastName: v.string(),
		email: v.string(),
		phone: v.string(),
		specialRequests: v.optional(v.string())
	},
	returns: v.id('bookings'),
	handler: async (ctx, args) => {
		const accommodation = await ctx.db.get('accommodations', args.accommodationId);
		if (!isAccommodationVisible(accommodation)) {
			throw new ConvexError<BackendErrorData>({ code: 'ACCOMMODATION_NOT_FOUND' });
		}

		const supported = accommodation.supportedPaymentMethods;
		const paymentMethod = args.paymentMethod;
		const paymentUnsupported = supported !== 'both' && paymentMethod !== supported;
		if (paymentUnsupported) {
			throw new ConvexError<BackendErrorData>({ code: 'PAYMENT_METHOD_UNSUPPORTED' });
		}

		const timeZone = timeZoneSchema.safeParse(accommodation.timeZone);
		const bookingMode = accommodation.bookingMode ?? 'request';
		const modeChanged =
			args.expectedBookingMode !== bookingMode &&
			(bookingMode === 'instant' || args.expectedBookingMode !== undefined);

		if (modeChanged) throw new ConvexError<BackendErrorData>({ code: 'BOOKING_MODE_CHANGED' });

		const instant = bookingMode === 'instant';

		const policy = recordedCancellationPolicySchema.safeParse(accommodation.cancellationPolicy);
		const reviewedPolicy = recordedCancellationPolicySchema.safeParse(
			args.expectedCancellationPolicy
		);

		const policyChanged =
			!reviewedPolicy.success ||
			(policy.success && JSON.stringify(policy.data) !== JSON.stringify(reviewedPolicy.data));
		if (!timeZone.success || !policy.success || policyChanged) {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_TERMS_UNAVAILABLE' });
		}

		const now = Date.now();

		// The client preview is not authoritative: re-check the stay against the stored listing.
		const parsed = createBookingSchema({
			today: getIsoDateInTimeZone(now, timeZone.data),
			minimumStay: accommodation.minimumStay,
			maximumStay: accommodation.maximumStay,
			maxGuests: accommodation.maxGuests,
			sameDayReservation: accommodation.sameDayReservation
		}).safeParse({ ...args, paymentMethod });

		if (!parsed.success) {
			const arrivalTodayDisabled = parsed.error.issues.some(
				(issue) => issue.code === 'custom' && issue.params?.code === 'SAME_DAY_RESERVATION_DISABLED'
			);
			throw new ConvexError<BackendErrorData>({
				code: arrivalTodayDisabled ? 'SAME_DAY_RESERVATION_DISABLED' : 'INVALID_BOOKING'
			});
		}

		const identity = await ctx.auth.getUserIdentity();
		const ownerId = identity ? getOwnerId(identity) : undefined;
		const loyalty = await getBookingBenefitsContext(ctx, accommodation, ownerId);
		const quote = calculateLoyaltyQuote(
			accommodation,
			parsed.data.checkInDate,
			parsed.data.checkOutDate,
			loyalty.level,
			loyalty.services,
			parsed.data.adults + parsed.data.children,
			loyalty.discountMode
		);
		const effectivePrice = quote.pricing.effectivePricePerNightMinor;
		const stayPricing = quote.stayPricing;
		if (args.expectedPricePerNightMinor !== effectivePrice) {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_PRICE_CHANGED' });
		}
		if (!areLoyaltyBenefitsEqual(args.expectedLoyaltyBenefits, quote.benefits)) {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_BENEFITS_CHANGED' });
		}
		if (args.expectedTotalMinor !== stayPricing.totalMinor)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_PRICE_CHANGED' });
		const { checkInStart, checkOut } = accommodation;

		let checkInAt: number;
		let checkOutAt: number;

		try {
			checkInAt = getZonedTimestamp(parsed.data.checkInDate, checkInStart, timeZone.data);
		} catch {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_CHECK_IN_TIME_UNAVAILABLE' });
		}

		if (checkInAt <= now) throw new ConvexError<BackendErrorData>({ code: 'BOOKING_START_PASSED' });

		try {
			checkOutAt = getZonedTimestamp(parsed.data.checkOutDate, checkOut, timeZone.data);
		} catch {
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_CHECK_OUT_TIME_UNAVAILABLE' });
		}
		if (checkOutAt <= checkInAt)
			throw new ConvexError<BackendErrorData>({ code: 'BOOKING_TERMS_UNAVAILABLE' });

		const {
			expectedBookingMode: _expectedBookingMode,
			expectedPricePerNightMinor: _expectedPrice,
			expectedTotalMinor: _expectedTotal,
			...bookingDetails
		} = parsed.data;

		const booking = {
			loyaltyStatus: accommodation.loyaltyEligible ? ('pending' as const) : ('ineligible' as const),
			...bookingDetails,
			platformFeeTerms: calculateBookingPlatformFee(
				accommodation,
				stayPricing.totalMinor,
				COMPANY_DATA.CURRENCY,
				now
			),
			// Keep the validator-typed id: the shared schema only knows it as a string.
			accommodationId: args.accommodationId,
			ownerId,
			// The host owns everything booked on their listing; copied now so host pages need no join scan.
			hostId: accommodation.ownerId,
			bookingMode,
			status: instant ? ('confirmed' as const) : ('pending' as const),
			requestExpiresAt: instant
				? undefined
				: Math.min(now + BOOKINGS_CONFIG.REQUEST_RESPONSE_WINDOW_MS, checkInAt),
			cancellationTerms: {
				policy: policy.data,
				timeZone: timeZone.data,
				checkInStart,
				checkInAt,
				refundDeadlineAt:
					policy.data.mode === 'custom' || policy.data.mode === 'full_refund'
						? undefined
						: checkInAt -
							ACCOMMODATION_CONFIG.CANCELLATION_POLICY_HOURS[policy.data.mode] * 60 * 60 * 1000,
				checkOut,
				checkOutAt,
				pricePerNightMinor: effectivePrice,
				basePricePerNightMinor: accommodation.pricePerNightMinor,
				discountBps: quote.pricing.discountBps,
				loyaltyBenefits: quote.benefits ?? undefined,
				stayPricing,
				stayType: 'overnight' as const,
				pricePerDayUseMinor: null,
				currency: COMPANY_DATA.CURRENCY
			},
			searchText: `${parsed.data.lastName} ${parsed.data.email}`.toLowerCase()
		};

		await checkBookingAvailability(ctx, booking);
		const bookingId = await ctx.db.insert('bookings', booking);

		if (ownerId) {
			const stored = await ctx.db.get('bookings', bookingId);
			if (stored) await bookingOwnerAggregate.insert(ctx, stored);
		}

		const host = await ctx.runQuery(components.betterAuth.queries.getUser.getUser, {
			id: booking.hostId
		});
		if (!host) throw new Error('Booking host account is unavailable');

		// Queue both receipts with the booking; the component delivers them asynchronously.
		const emailData = { bookingId, booking, accommodationName: accommodation.name };
		if (instant) {
			const sameEmailRecipient = booking.email === host.email.trim().toLowerCase();
			if (!sameEmailRecipient) await sendBookingConfirmationEmail(ctx, emailData);
			await sendBookingConfirmationEmail(ctx, {
				...emailData,
				hostEmail: host.email
			});
			return bookingId;
		}

		await sendBookingRequestEmail(ctx, {
			...emailData,
			recipient: 'guest',
			email: booking.email
		});

		await sendBookingRequestEmail(ctx, {
			...emailData,
			recipient: 'host',
			email: host.email
		});

		return bookingId;
	}
});
