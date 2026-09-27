// LIBRARIES
import { z } from 'zod';
import { m } from './paraglide/messages.js';

// Loaded once by hooks.ts. Resolve translations at validation time, for the current locale.
z.config({
	customError: (issue) => {
		const empty =
			issue.input == null ||
			// oxlint-disable-next-line anti-slop/no-runtime-typeof -- Failed Zod inputs are unknown; do not parse recursively inside the error map.
			(typeof issue.input === 'string' && issue.input.trim() === '') ||
			(Array.isArray(issue.input) && issue.input.length === 0);
		if (empty) return m['ValidationMessages.required']();

		switch (issue.code) {
			case 'invalid_value':
				return m['ValidationMessages.invalidSelection']();
			case 'invalid_type':
				if (issue.expected === 'int') return m['ValidationMessages.integer']();
				if (issue.expected === 'number') return m['ValidationMessages.number']();
				break;
			case 'invalid_format':
				if (issue.format === 'email') return m['ValidationMessages.invalidEmail']();
				if (issue.format === 'date') return m['ValidationMessages.date']();
				if (issue.format === 'time') return m['ValidationMessages.time']();
				break;
			case 'too_small': {
				const minimum = String(issue.minimum);
				if (issue.origin === 'string') return m['ValidationMessages.minLength']({ minimum });
				if (issue.origin === 'array') return m['ValidationMessages.minItems']({ minimum });
				if (issue.origin === 'number')
					return issue.inclusive
						? m['ValidationMessages.minimum']({ minimum })
						: m['ValidationMessages.greaterThan']({ minimum });
				break;
			}
			case 'too_big': {
				const maximum = String(issue.maximum);
				if (issue.origin === 'string') return m['ValidationMessages.maxLength']({ maximum });
				if (issue.origin === 'array') return m['ValidationMessages.maxItems']({ maximum });
				if (issue.origin === 'number')
					return issue.inclusive
						? m['ValidationMessages.maximum']({ maximum })
						: m['ValidationMessages.lessThan']({ maximum });
				break;
			}
			case 'not_multiple_of':
				return m['ValidationMessages.multipleOf']({ step: String(issue.divisor) });
			case 'custom':
				switch (issue.params?.code) {
					case 'PAST_STAY_DATE':
						return m['ValidationMessages.pastStayDate']();
					case 'STAY_DATE_ORDER':
						return m['ValidationMessages.stayDateOrder']();
					case 'STAY_BELOW_MINIMUM':
						return m['ValidationMessages.minimumStay']({ count: issue.params.count });
					case 'STAY_ABOVE_MAXIMUM':
						return m['ValidationMessages.maximumStay']({ count: issue.params.count });
					case 'STAY_GUEST_LIMIT':
						return m['ValidationMessages.guestLimit']({ count: issue.params.count });
				}
				break;
		}
		return m['ValidationMessages.invalid']();
	}
});
