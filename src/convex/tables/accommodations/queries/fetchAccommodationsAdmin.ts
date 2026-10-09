// LIBRARIES
import { docValidator } from 'convex/server';
import { pick } from 'convex-helpers';
import { v } from 'convex/values';

// BUILDERS
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

// HELPERS
import { getPagination } from '../../../helpers/getPagination.js';
import { paginateSearch } from '../../../helpers/paginateSearch.js';

// VALIDATORS
import { listPageArgs } from '../../../validators/listPageArgs.js';
import { accommodationOwnerPage } from '../validators/accommodationValidators.js';

// SCHEMAS
import { accommodations } from '../schema.js';

const ADMIN_FIELDS = [
	'_id',
	'name',
	'ownerId',
	'loyaltyEligible',
	'loyaltyServices',
	'status',
	'billingPlanId',
	'billingTerms',
	'billingStatus',
	'billingPeriodEndsAt',
	'updatedAt'
] as const;

export const fetchAccommodationsAdmin = adminQuery({
	args: listPageArgs,
	returns: accommodationOwnerPage.omit('items').extend({
		items: v.array(
			docValidator('accommodations', accommodations)
				.pick(...ADMIN_FIELDS)
				.extend({
					address: v.object({ city: v.string(), country: v.string() })
				})
		)
	}),
	handler: async (ctx, args) => {
		const statusValue = args.filters?.status;
		const planValue = args.filters?.billingPlanId;
		const billingValue = args.filters?.billingStatus;
		const status =
			statusValue === 'published' || statusValue === 'unpublished' || statusValue === 'deleted'
				? statusValue
				: undefined;
		const plan =
			planValue === 'flat_fee' || planValue === 'booking_fee' || planValue === 'free'
				? planValue
				: undefined;
		const billing =
			billingValue === 'active' || billingValue === 'pending_payment' ? billingValue : undefined;
		const search = args.search?.trim();
		let page;
		if (search) {
			page = await paginateSearch({
				ctx,
				search,
				paginationOpts: args.paginationOpts,
				buildQuery: ({ search: term }) =>
					ctx.db.query('accommodations').withSearchIndex('search_name', (q) => {
						let query = q.search('name', term);
						if (status) query = query.eq('status', status);
						if (plan) query = query.eq('billingPlanId', plan);
						if (billing) query = query.eq('billingStatus', billing);
						return query;
					})
			});
		} else {
			const source = plan
				? ctx.db
						.query('accommodations')
						.withIndex('by_billing_plan_id', (q) => q.eq('billingPlanId', plan))
				: status
					? ctx.db.query('accommodations').withIndex('by_status', (q) => q.eq('status', status))
					: billing
						? ctx.db
								.query('accommodations')
								.withIndex('by_billing_status', (q) => q.eq('billingStatus', billing))
						: ctx.db.query('accommodations');
			// Additional combinations refine an indexed, paginated result before pagination.
			const filtered = source.filter((q) =>
				q.and(
					status ? q.eq(q.field('status'), status) : q.eq(1, 1),
					plan ? q.eq(q.field('billingPlanId'), plan) : q.eq(1, 1),
					billing ? q.eq(q.field('billingStatus'), billing) : q.eq(1, 1)
				)
			);
			page = await getPagination(filtered.order('desc'), { paginationOpts: args.paginationOpts });
		}
		return {
			...page,
			items: page.items.map((item) => ({
				...pick(item, [...ADMIN_FIELDS]),
				address: { city: item.address.city, country: item.address.country }
			}))
		};
	}
});
