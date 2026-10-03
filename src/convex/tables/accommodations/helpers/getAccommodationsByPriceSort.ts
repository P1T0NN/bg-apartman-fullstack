// TYPES
import type { QueryCtx } from '../../../_generated/server.js';

/** Database ordering before pagination; geographic scope comes from the validated search. */
export function getAccommodationsByPriceSort(
	ctx: QueryCtx,
	direction: 'asc' | 'desc',
	country?: string,
	city?: string
) {
	const query = ctx.db.query('accommodations');

	if (!country) return query.withIndex('by_price').order(direction);

	if (city) {
		return query
			.withIndex('by_address_country_city_price', (q) =>
				q.eq('address.country', country).eq('address.city', city)
			)
			.order(direction);
	}

	return query
		.withIndex('by_address_country_price', (q) => q.eq('address.country', country))
		.order(direction);
}
