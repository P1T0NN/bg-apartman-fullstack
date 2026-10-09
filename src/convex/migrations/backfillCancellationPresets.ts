import { migrations } from './migrations.js';
import { getMatchingCancellationPreset } from '../../shared/features/accommodations/utils/getMatchingCancellationPreset.js';
import { ACCOMMODATION_CONFIG } from '../../shared/features/accommodations/config.js';

/** Approved listing-only conversion; accepted booking snapshots remain unchanged. */
export const backfillFullRefundListingsToFlexible = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		const policy = accommodation.cancellationPolicy;
		const isFullRefund =
			policy.mode === 'full_refund' ||
			(policy.mode === 'custom' &&
				ACCOMMODATION_CONFIG.CANCELLATION_POLICY_RANGES.every((range) => policy[range] === 100));
		if (!isFullRefund) return;
		await ctx.db.patch('accommodations', accommodation._id, {
			cancellationPolicy: { version: 1, mode: 'flexible' }
		});
	}
});

export const backfillAccommodationCancellationPresets = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		const preset = getMatchingCancellationPreset(accommodation.cancellationPolicy);
		if (!preset || preset.mode === accommodation.cancellationPolicy.mode) return;
		await ctx.db.patch('accommodations', accommodation._id, { cancellationPolicy: preset });
	}
});

export const backfillBookingCancellationPresets = migrations.define({
	table: 'bookings',
	migrateOne: async (ctx, booking) => {
		const terms = booking.cancellationTerms;
		const preset = getMatchingCancellationPreset(terms.policy);
		if (!preset || terms.refundDeadlineAt !== undefined) return;
		const hours = ACCOMMODATION_CONFIG.CANCELLATION_POLICY_HOURS[preset.mode];
		await ctx.db.patch('bookings', booking._id, {
			cancellationTerms: {
				...terms,
				policy: preset,
				refundDeadlineAt: terms.checkInAt - hours * 60 * 60 * 1000
			}
		});
	}
});
