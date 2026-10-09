import type { CancellationRefundPercentage } from '../../accommodations/types/cancellationPolicyTypes.js';

/** Round once, half up, in the booking currency's minor units. */
export function calculateBookingRefundAmount(
	amountMinor: number,
	percentage: CancellationRefundPercentage
) {
	const invalidAmount = !Number.isSafeInteger(amountMinor) || amountMinor < 0;
	if (invalidAmount || ![0, 50, 100].includes(percentage))
		throw new Error('Invalid refund amount or percentage');
	return Number((BigInt(amountMinor) * BigInt(percentage) + 50n) / 100n);
}
