// LIBRARIES
import { m } from '@/lib/paraglide/messages';

// HOOKS
import { useTimeZone } from '../../timezone/hooks/useTimeZone.svelte.js';

// TYPES
import type {
	FormFieldContext,
	FormValue
} from '@/components/ui/custom-components/form/formTypes.js';

export function useAccommodationTimeZone(getContext: () => FormFieldContext<FormValue>) {
	const lookup = useTimeZone((timeZone) => {
		const context = getContext();
		context.setValue('timeZone', timeZone);
		context.errors.timeZone = '';
	});

	function setPosition(point: { lat: number; lng: number }) {
		const context = getContext();
		context.setValue('latitude', point.lat);
		context.setValue('longitude', point.lng);
		return lookup.resolve({ latitude: point.lat, longitude: point.lng });
	}

	function retry() {
		const context = getContext();
		void setPosition({
			lat: Number(context.inputValue('latitude')),
			lng: Number(context.inputValue('longitude'))
		});
	}

	return {
		setPosition,
		clear: lookup.clear,
		retry,
		get pending() {
			return lookup.pending;
		},
		get error() {
			if (lookup.error === 'ambiguous') return m['TimezoneFeature.ambiguous']();
			if (lookup.error === 'unavailable') return m['TimezoneFeature.unavailable']();
			return '';
		}
	};
}
