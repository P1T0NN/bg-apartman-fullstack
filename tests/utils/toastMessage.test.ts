import { ConvexError } from 'convex/values';
import { expect, test } from 'vitest';

import { overwriteGetLocale } from '../../src/lib/paraglide/runtime.js';
import { getBackendErrorMessage } from '../../src/utils/getBackendErrorMessage.js';

test('translates known backend error codes and ignores unknown errors', () => {
	overwriteGetLocale(() => 'en');
	expect(getBackendErrorMessage(new ConvexError({ code: 'TOO_MANY_FILES', maxFiles: 5 }))).toBe(
		'Maximum number of items: 5.'
	);
	for (const code of ['INVALID_RETAINED_IMAGE', 'INVALID_UPLOAD_NAMESPACE', 'INVALID_UPLOAD']) {
		expect(getBackendErrorMessage(new ConvexError({ code }))).toBe('The selected file is invalid.');
	}
	for (const code of ['DUPLICATE_RETAINED_IMAGE', 'DUPLICATE_UPLOAD_KEY']) {
		expect(getBackendErrorMessage(new ConvexError({ code }))).toBe(
			'Remove duplicate files and try again.'
		);
	}
	expect(getBackendErrorMessage(new ConvexError({ code: 'UNKNOWN' }))).toBeUndefined();
	expect(
		getBackendErrorMessage(new ConvexError({ code: 'TOO_MANY_FILES', maxFiles: 'invalid' }))
	).toBeUndefined();
	expect(getBackendErrorMessage(new Error('Database failed'))).toBeUndefined();
	expect(getBackendErrorMessage(new ConvexError({ code: 'UPLOAD_NOT_FOUND' }))).toBe(
		'The upload could not be found.'
	);
});
