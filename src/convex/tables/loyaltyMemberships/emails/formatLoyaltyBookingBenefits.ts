import { loyaltyBookingBenefitsTranslation } from './translations/loyaltyBookingBenefitsTranslation.js';
import { formatCurrency } from '../../../../shared/utils/currency.js';
import type { BookingCancellationTerms } from '../../../../shared/features/bookings/types/bookingTypes.js';

export function formatLoyaltyBookingBenefits(terms: BookingCancellationTerms): string[] {
	const benefits = terms.loyaltyBenefits;
	if (!benefits) return [];
	const copy = loyaltyBookingBenefitsTranslation.en;
	const money = (amount: number) => formatCurrency(amount, 'en', terms.currency);
	return [
		copy.level(benefits.level),
		...(benefits.propertySavingsMinor > 0
			? [
					copy.propertyDiscount(
						benefits.propertyDiscountBps / 100,
						money(benefits.propertySavingsMinor)
					)
				]
			: []),
		...(benefits.loyaltySavingsMinor > 0
			? [
					copy.loyaltyDiscount(
						benefits.loyaltyDiscountBps / 100,
						money(benefits.loyaltySavingsMinor)
					)
				]
			: []),
		...(benefits.parking ? [copy.parking] : []),
		...(benefits.breakfast === 'none'
			? []
			: [
					benefits.breakfast === 'all' ? copy.breakfastAll : copy.breakfastTwo,
					copy.breakfastGuests(benefits.breakfastGuests)
				]),
		...(benefits.spa ? [copy.spa] : []),
		copy.total(money(terms.stayPricing.totalMinor))
	];
}
