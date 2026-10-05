import { ACCOMMODATION_CONFIG } from '../../src/shared/features/accommodations/config.js';
import { COMPANY_DATA } from '../../src/shared/config.js';
import { getZonedTimestamp } from '../../src/shared/features/timezone/utils/getZonedTimestamp.js';

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
		currency: COMPANY_DATA.CURRENCY
	};
}
