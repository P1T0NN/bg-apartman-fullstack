// UTILS
import { getTimeZone } from '../utils/getTimeZone.js';

// TYPES
import type { TimeZoneCoordinates } from '../../../shared/features/timezone/schemas/timezoneSchemas.js';

export function useTimeZone(onChange: (timeZone: string) => void) {
	let pending = $state(false);
	let error = $state<'' | 'unavailable' | 'ambiguous'>('');
	let request = 0;

	function clear() {
		request++;
		pending = false;
		error = '';
		onChange('');
	}

	async function resolve(coordinates: TimeZoneCoordinates) {
		clear();
		const currentRequest = request;
		pending = true;

		try {
			const timeZone = await getTimeZone(coordinates);
			if (request === currentRequest) onChange(timeZone);
		} catch (cause) {
			if (request === currentRequest)
				error =
					cause instanceof Error && cause.message === 'AMBIGUOUS_TIME_ZONE'
						? 'ambiguous'
						: 'unavailable';
		} finally {
			if (request === currentRequest) pending = false;
		}
	}

	return {
		resolve,
		clear,
		get pending() {
			return pending;
		},
		get error() {
			return error;
		}
	};
}
