// CONFIG
import { ACCOMMODATION_BILLING_PLANS } from '../../accommodations/config.js';

// TYPES
import type { Doc } from '../../../../convex/_generated/dataModel.js';

type BillingFields = Pick<
	Doc<'accommodations'>,
	'billingPlanId' | 'billingTerms' | 'billingStatus' | 'billingPeriodEndsAt'
>;

/** Freeze the fee on the discounted stay total; later listing changes cannot change it. */
export function calculateBookingPlatformFee(
	accommodation: BillingFields,
	baseAmountMinor: number,
	currency: string,
	now: number
) {
	const hasInvalidTerms =
		accommodation.billingPlanId !== accommodation.billingTerms.model ||
		accommodation.billingStatus !== 'active' ||
		!Number.isSafeInteger(baseAmountMinor) ||
		baseAmountMinor <= 0 ||
		!currency;
	if (hasInvalidTerms) throw new Error('Invalid booking fee terms');

	let model = accommodation.billingPlanId;
	let commissionBps = 0;
	if (accommodation.billingTerms.model === 'booking_fee') {
		commissionBps = accommodation.billingTerms.commissionBps;
	} else if (model === 'free') {
		const freePeriodExpired =
			accommodation.billingPeriodEndsAt !== null && accommodation.billingPeriodEndsAt <= now;
		if (freePeriodExpired) {
			model = 'booking_fee';
			commissionBps = ACCOMMODATION_BILLING_PLANS.booking_fee.commissionBps;
		}
	} else {
		const paidPeriodExpired =
			accommodation.billingPeriodEndsAt === null || accommodation.billingPeriodEndsAt <= now;
		if (paidPeriodExpired) throw new Error('Flat-fee period is not paid');
	}

	const invalidCommission =
		!Number.isSafeInteger(commissionBps) || commissionBps < 0 || commissionBps > 10000;
	if (invalidCommission) throw new Error('Invalid booking commission');

	// Integer arithmetic, rounded half up once per booking, without multiplication overflow.
	const amountMinor = Number((BigInt(baseAmountMinor) * BigInt(commissionBps) + 5000n) / 10000n);
	return { model, commissionBps, baseAmountMinor, amountMinor, currency };
}
