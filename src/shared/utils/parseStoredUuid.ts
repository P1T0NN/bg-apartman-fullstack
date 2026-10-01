// LIBRARIES
import { z } from 'zod';

// UTILS
import { isUuid } from './isUuid.js';

const storedUuidSchema = z.string().refine(isUuid);

/** Parse a JSON-encoded localStorage value that should hold a UUID. */
export function parseStoredUuid(raw: string | null): string | undefined {
	if (raw === null) return undefined;

	try {
		const parsed = storedUuidSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : undefined;
	} catch {
		return undefined;
	}
}
