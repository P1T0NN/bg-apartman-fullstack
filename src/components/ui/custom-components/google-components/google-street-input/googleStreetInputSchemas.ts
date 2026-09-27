// LIBRARIES
import { z } from 'zod';

export const streetSuggestionSchema = z.object({
	placeId: z.string(),
	mainText: z.string(),
	secondaryText: z.string()
});

export const streetSuggestionsResponseSchema = z.object({
	suggestions: z.array(streetSuggestionSchema)
});

export const streetAddressSchema = z.object({
	street: z.string().nullable(),
	city: z.string().nullable(),
	country: z.string().nullable(),
	postalCode: z.string().nullable()
});

export type StreetSuggestion = z.infer<typeof streetSuggestionSchema>;
export type StreetAddress = z.infer<typeof streetAddressSchema>;
