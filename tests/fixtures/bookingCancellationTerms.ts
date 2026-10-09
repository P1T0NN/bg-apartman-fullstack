import { calculateStayPricing } from '../../src/shared/features/bookings/utils/calculateStayPricing.js';
import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config.js';
import { COMPANY_DATA } from '../../src/shared/config.js';
import { getZonedTimestamp } from '../../src/shared/features/timezone/utils/getZonedTimestamp.js';
import type { CancellationPolicy } from '../../src/shared/features/accommodations/types/cancellationPolicyTypes.js';

export function bookingCancellationTerms(
	checkInDate: string,
	checkOutDate: string,
	timeZone = 'Europe/Belgrade',
	checkOut = '11:00'
) {
	return {
		stayType: 'overnight' as const,
		pricePerDayUseMinor: null,
		policy: ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		timeZone,
		checkInStart: '14:00',
		checkInAt: getZonedTimestamp(checkInDate, '14:00', timeZone),
		checkOut,
		checkOutAt: getZonedTimestamp(checkOutDate, checkOut, timeZone),
		pricePerNightMinor: 8025,
		basePricePerNightMinor: 8025,
		discountBps: 0,
		stayPricing: calculateStayPricing(
			{ pricePerNightMinor: 8025, discountBps: 0 },
			checkInDate,
			checkOutDate
		),
		currency: COMPANY_DATA.CURRENCY
	};
}

export function withExpectedTotal<
	T extends {
		checkInDate: string;
		checkOutDate: string;
		expectedPricePerNightMinor: number;
		expectedTotalMinor?: number;
		expectedCancellationPolicy?: CancellationPolicy;
	}
>(args: T) {
	return {
		...args,
		expectedCancellationPolicy:
			args.expectedCancellationPolicy ?? ACCOMMODATION_CONFIG.CANCELLATION_DEFAULT_POLICY,
		expectedTotalMinor:
			args.expectedTotalMinor ??
			Math.max(
				1,
				((Date.parse(args.checkOutDate) - Date.parse(args.checkInDate)) / 86400000) *
					args.expectedPricePerNightMinor
			)
	};
}
