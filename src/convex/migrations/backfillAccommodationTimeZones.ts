// MIGRATIONS
import { migrations } from './migrations.js';

// SCHEMAS
import { timeZoneSchema } from '../../shared/features/timezone/schemas/timezoneSchemas.js';

/** These countries each have one timezone and cover every existing development listing. */
const TIME_ZONES = new Map([
	['Serbia', 'Europe/Belgrade'],
	['Hungary', 'Europe/Budapest'],
	['Croatia', 'Europe/Zagreb'],
	['Bosnia and Herzegovina', 'Europe/Sarajevo']
]);

/** Preserve valid selections; fail explicitly for locations this backfill cannot resolve. */
export const backfillAccommodationTimeZones = migrations.define({
	table: 'accommodations',
	migrateOne: async (ctx, accommodation) => {
		if (timeZoneSchema.safeParse(accommodation.timeZone).success) return;
		const timeZone = TIME_ZONES.get(accommodation.address.country);
		if (!timeZone) throw new Error(`Resolve timezone for accommodation ${accommodation._id}`);
		await ctx.db.patch('accommodations', accommodation._id, { timeZone });
	}
});
