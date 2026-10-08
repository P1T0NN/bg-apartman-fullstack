// UTILS
import { DAY_IN_MS, parseIsoDate } from '../../../utils/date.js';
import { calculateDiscountedPrice } from '../../accommodations/utils/calculateAccommodationPricing.js';

export type NightlyPricing = {
	pricePerNightMinor: number;
	discountBps: number;
	loyaltyDiscountBps?: number;
	weekendPricePerNightMinor?: number | null;
};

function discountedNightlyPrice(price: number, pricing: NightlyPricing): number {
	return calculateDiscountedPrice(
		calculateDiscountedPrice(price, pricing.discountBps),
		pricing.loyaltyDiscountBps ?? 0
	);
}

/** ISO dates are property-local calendar labels. UTC arithmetic avoids browser timezone and DST shifts. */
export function getNightlyPricing(pricing: NightlyPricing, date: string) {
	const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
	const weekend = weekday === 5 || weekday === 6;
	const pricePerNightMinor = weekend
		? (pricing.weekendPricePerNightMinor ?? pricing.pricePerNightMinor)
		: pricing.pricePerNightMinor;
	return {
		pricePerNightMinor,
		discountBps: pricing.discountBps,
		effectivePricePerNightMinor: discountedNightlyPrice(pricePerNightMinor, pricing)
	};
}

/** Counts full weeks plus at most six remaining nights; checkout is excluded. */
export function calculateStayPricing(
	pricing: NightlyPricing,
	checkInDate: string,
	checkOutDate: string
) {
	const start = parseIsoDate(checkInDate);
	const end = parseIsoDate(checkOutDate);
	const nights =
		start && end ? (Date.parse(end.toString()) - Date.parse(start.toString())) / DAY_IN_MS : 0;
	const validNights = Math.max(0, nights);
	let weekendNights = 0;
	if (pricing.weekendPricePerNightMinor != null && start) {
		weekendNights = Math.floor(validNights / 7) * 2;
		const firstWeekday = new Date(`${start.toString()}T00:00:00Z`).getUTCDay();
		for (let offset = 0; offset < validNights % 7; offset++) {
			const weekday = (firstWeekday + offset) % 7;
			if (weekday === 5 || weekday === 6) weekendNights++;
		}
	}
	const regularNights = validNights - weekendNights;
	const weekendBasePricePerNightMinor = pricing.weekendPricePerNightMinor ?? null;
	const weekendPricePerNightMinor =
		weekendBasePricePerNightMinor === null
			? null
			: discountedNightlyPrice(weekendBasePricePerNightMinor, pricing);
	return {
		regularNights,
		weekendNights,
		weekendBasePricePerNightMinor,
		weekendPricePerNightMinor,
		totalMinor:
			regularNights * discountedNightlyPrice(pricing.pricePerNightMinor, pricing) +
			weekendNights * (weekendPricePerNightMinor ?? 0)
	};
}
