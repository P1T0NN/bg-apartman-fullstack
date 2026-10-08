// Accommodation defaults and boundaries live here.

export const ACCOMMODATION_CONFIG = {
	/** R2 key prefix for accommodation photos. */
	uploadNamespace: 'accommodations/images',
	mapSearchPageSize: 500,
	MAX_BLOCKED_DATES_PER_OPERATION: 30,
	searchMaximumRowsRead: 1000,
	/** Initial recommendation prior: neutral 3/5, with the weight of five reviews. */
	recommendationBaselineAverage: 3,
	recommendationBaselineWeight: 5,
	CANCELLATION_REFUND_PERCENTAGES: [100, 50, 0],
	CANCELLATION_POLICY_DEADLINE_HOURS: {
		sevenDaysOrMore: 168,
		fiveToSevenDays: 120,
		threeToFiveDays: 72,
		oneToThreeDays: 24
	},
	CANCELLATION_POLICY_RANGES: [
		'fiveToSevenDays',
		'threeToFiveDays',
		'oneToThreeDays',
		'under24Hours'
	],
	CANCELLATION_DEFAULT_POLICY: {
		version: 1,
		mode: 'full_refund'
	}
} as const;

/** Enable payment and refund previews until real payment handling is implemented. */
export const ACCOMMODATION_PAYMENT_SIMULATION: boolean = false;

// Terms are copied into each accommodation when the host chooses a billing plan.
export const ACCOMMODATION_BILLING_PLANS = {
	flat_fee: {
		model: 'flat_fee',
		amountMinor: 30000, // 300e
		currency: 'EUR',
		intervalMonths: 3
	},
	booking_fee: {
		model: 'booking_fee',
		commissionBps: 1000 // 10%
	}
} as const;
