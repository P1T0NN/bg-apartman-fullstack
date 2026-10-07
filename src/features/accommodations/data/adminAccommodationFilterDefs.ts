// MESSAGES
import { m } from '@/lib/paraglide/messages.js';

// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

export const ADMIN_ACCOMMODATION_FILTER_DEFS = [
	{
		key: 'status',
		get label() {
			return m['AdminAccommodationsPage.filters.publication']();
		},
		get options() {
			return [
				{ value: '', label: m['AdminAccommodationsPage.filters.allPublication']() },
				{ value: 'published', label: m['AdminAccommodationsPage.filters.published']() },
				{ value: 'unpublished', label: m['AdminAccommodationsPage.filters.paused']() },
				{ value: 'deleted', label: m['AdminAccommodationsPage.filters.deleted']() }
			];
		}
	},
	{
		key: 'billingPlanId',
		get label() {
			return m['AdminAccommodationsPage.filters.feePlan']();
		},
		get options() {
			return [
				{ value: '', label: m['AdminAccommodationsPage.filters.allPlans']() },
				{ value: 'flat_fee', label: m['AdminAccommodationsPage.filters.flatFee']() },
				{ value: 'booking_fee', label: m['AdminAccommodationsPage.filters.bookingFee']() },
				{ value: 'free', label: m['AdminAccommodationsPage.filters.free']() }
			];
		}
	},
	{
		key: 'billingStatus',
		get label() {
			return m['AdminAccommodationsPage.filters.billing']();
		},
		get options() {
			return [
				{ value: '', label: m['AdminAccommodationsPage.filters.allBilling']() },
				{ value: 'active', label: m['AdminAccommodationsPage.filters.active']() },
				{ value: 'pending_payment', label: m['AdminAccommodationsPage.filters.paymentRequired']() }
			];
		}
	}
] satisfies FilterDef[];
