// TYPES
import type { QueryCtx } from '../../../_generated/server.js';

/** Higher recommendation scores first, then lower nightly prices and creation time. */
export function getAccommodationsByRecommendedSort(ctx: QueryCtx, country?: string, city?: string) {
	const query = ctx.db.query('accommodations');

	if (!country) return query.withIndex('by_recommendation_sort_key_price').order('asc');

	if (city) {
		return query
			.withIndex('by_address_country_city_recommendation_sort_key_price', (q) =>
				q.eq('address.country', country).eq('address.city', city)
			)
			.order('asc');
	}
	
	return query
		.withIndex('by_address_country_recommendation_sort_key_price', (q) =>
			q.eq('address.country', country)
		)
		.order('asc');
}
