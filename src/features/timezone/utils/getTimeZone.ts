// SCHEMAS
import {
	timeZoneCoordinatesSchema,
	timeZoneSchema
} from '../../../shared/features/timezone/schemas/timezoneSchemas.js';

// TYPES
import type { TimeZoneCoordinates } from '../../../shared/features/timezone/schemas/timezoneSchemas.js';
import type { Lookup } from 'lltz';

let lookupPromise: Promise<Lookup> | undefined;

function loadLookup(): Promise<Lookup> {
	lookupPromise ??= Promise.all([import('lltz'), import('lltz/data/timezones.lltz?url')])
		.then(async ([{ make }, { default: url }]) => {
			const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
			if (!response.ok) throw new Error('TIME_ZONE_UNAVAILABLE');
			return make(await response.arrayBuffer());
		})
		.catch(() => {
			lookupPromise = undefined;
			throw new Error('TIME_ZONE_UNAVAILABLE');
		});

	return lookupPromise;
}

/** Browser lookup. Never guess when a location belongs to multiple timezones. */
export async function getTimeZone(coordinates: TimeZoneCoordinates): Promise<string> {
	const { latitude, longitude } = timeZoneCoordinatesSchema.parse(coordinates);

	const zones = (await loadLookup())(latitude, longitude);

	if (zones.length > 1) throw new Error('AMBIGUOUS_TIME_ZONE');
	if (zones.length === 0) throw new Error('TIME_ZONE_UNAVAILABLE');

	return timeZoneSchema.parse(zones[0]);
}
