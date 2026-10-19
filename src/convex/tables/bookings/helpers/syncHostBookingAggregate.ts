// AGGREGATES
import { bookingHostAggregate } from '../aggregates/bookingHostAggregate.js';

// HELPERS
import { syncBookingFeePayment } from '../../bookingFeePayments/helpers/syncBookingFeePayment.js';

// TYPES
import type { Doc } from '../../../_generated/dataModel.js';
import type { MutationCtx } from '../../../_generated/server.js';

/** Frozen host, currency, price and creation time make repeated lifecycle/backfill writes safe. */
export async function syncHostBookingAggregate(ctx: MutationCtx, booking: Doc<'bookings'>) {
	await syncBookingFeePayment(ctx, booking);
	if (!booking.hostId) return;
	const isAccepted = booking.status === 'confirmed' || booking.status === 'completed';
	if (isAccepted) await bookingHostAggregate.replaceOrInsert(ctx, booking, booking);
	else await bookingHostAggregate.deleteIfExists(ctx, booking);
}
