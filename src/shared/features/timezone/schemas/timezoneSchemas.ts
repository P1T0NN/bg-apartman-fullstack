import { z } from 'zod';
import { isIanaTimeZone } from '../utils/isIanaTimeZone.js';

export const timeZoneSchema = z
	.string()
	.trim()
	.min(1)
	.max(100)
	.refine(isIanaTimeZone, { params: { code: 'INVALID_TIME_ZONE' } });

export const timeZoneCoordinatesSchema = z.object({
	latitude: z.number().finite().min(-90).max(90),
	longitude: z.number().finite().min(-180).max(180)
});

export type TimeZoneCoordinates = z.infer<typeof timeZoneCoordinatesSchema>;
