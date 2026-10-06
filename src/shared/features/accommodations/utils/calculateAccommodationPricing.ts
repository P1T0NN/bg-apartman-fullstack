/** Positive integer cents, with the final nightly rate rounded half up once. */
export function calculateDiscountedPrice(pricePerNightMinor: number, discountBps: number): number {
	return Math.floor((pricePerNightMinor * (10_000 - discountBps) + 5_000) / 10_000);
}

/** Host forms use euros and percentages; stored prices and discounts are integers. */
export function calculateAccommodationPricing(
	nightlyPrice: number,
	discountPercent: number,
	weekendPrice: number | null = null
) {
	const pricePerNightMinor = Math.round(nightlyPrice * 100);
	const discountBps = Math.round(discountPercent * 100);
	return {
		pricePerNightMinor,
		discountBps,
		weekendPricePerNightMinor: weekendPrice === null ? null : Math.round(weekendPrice * 100),
		effectivePricePerNightMinor: calculateDiscountedPrice(pricePerNightMinor, discountBps)
	};
}
