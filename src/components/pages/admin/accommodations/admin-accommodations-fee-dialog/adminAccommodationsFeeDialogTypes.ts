// TYPES
import type { FunctionReturnType } from 'convex/server';
import type { api } from '@convex/_generated/api.js';

export type AdminAccommodationsFeeDialogAccommodation = FunctionReturnType<
	typeof api.tables.accommodations.queries.fetchAccommodationsAdmin.fetchAccommodationsAdmin
>['items'][number];

export type AdminAccommodationsFeeDialogDraft = {
	id: AdminAccommodationsFeeDialogAccommodation['_id'];
	plan: string;
	status: string;
	amount: number | undefined;
	months: number | undefined;
	commission: number | undefined;
	deadline: string;
	forever: boolean;
};
