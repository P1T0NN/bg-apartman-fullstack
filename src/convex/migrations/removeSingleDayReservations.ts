// MIGRATIONS
import { migrations } from './migrations.js';

/** Remove retired listing settings, retaining every booking's frozen terms. */
export const removeSingleDayReservations = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		// SAFETY: the transition schema permits these optional legacy fields; the final schema omits them.
		const legacy = accommodation as typeof accommodation & {
			singleDayReservation?: boolean;
			dayUseStart?: string | null;
			dayUseEnd?: string | null;
			pricePerDayUseMinor?: number | null;
		};
		const hasRetiredFields = [
			'singleDayReservation',
			'dayUseStart',
			'dayUseEnd',
			'pricePerDayUseMinor'
		].some((field) => field in legacy);
		if (!hasRetiredFields) return;
		const {
			_id,
			_creationTime,
			singleDayReservation: _singleDayReservation,
			dayUseStart: _dayUseStart,
			dayUseEnd: _dayUseEnd,
			pricePerDayUseMinor: _pricePerDayUseMinor,
			...retained
		} = legacy;
		await ctx.db.replace('accommodations', _id, retained);
	}
});
