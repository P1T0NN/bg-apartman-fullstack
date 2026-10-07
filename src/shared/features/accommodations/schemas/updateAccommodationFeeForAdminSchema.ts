// LIBRARIES
import { z } from 'zod';

export const updateAccommodationFeeForAdminSchema = z.object({
	id: z.string().min(1),
	billingTerms: z.discriminatedUnion('model', [
		z.object({
			model: z.literal('flat_fee'),
			amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
			currency: z.literal('EUR'),
			intervalMonths: z.number().int().min(1).max(120)
		}),
		z.object({
			model: z.literal('booking_fee'),
			commissionBps: z.number().int().min(0).max(10000)
		})
	]),
	billingStatus: z.enum(['active', 'pending_payment']),
	billingPeriodEndsAt: z.number().int().min(0).max(8640000000000000).nullable()
});
