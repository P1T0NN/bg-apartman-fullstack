// Accommodation defaults and boundaries live here.

export const ACCOMMODATION_CONFIG = {
	/** R2 key prefix for accommodation photos. */
	uploadNamespace: 'accommodations/images',
	mapSearchPageSize: 500,
	searchMaximumRowsRead: 1000,
	/** Initial recommendation prior: neutral 3/5, with the weight of five reviews. */
	recommendationBaselineAverage: 3,
	recommendationBaselineWeight: 5
} as const;
