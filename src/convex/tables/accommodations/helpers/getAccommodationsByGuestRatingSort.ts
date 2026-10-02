// TYPES
import type { QueryCtx } from '../../../_generated/server.js';

/** Highest public guest average first, then most published reviews; unrated listings last. */
export function getAccommodationsByGuestRatingSort(ctx: QueryCtx, country?: string, city?: string) {
	const query = ctx.db.query('accommodations');

	if (!country) return query.withIndex('by_guest_rating_average_guest_review_count').order('desc');

	if (city) {
		return query
			.withIndex('by_address_country_city_guest_rating_average_guest_review_count', (q) =>
				q.eq('address.country', country).eq('address.city', city)
			)
			.order('desc');
	}

	return query
		.withIndex('by_address_country_guest_rating_average_guest_review_count', (q) =>
			q.eq('address.country', country)
		)
		.order('desc');
}
