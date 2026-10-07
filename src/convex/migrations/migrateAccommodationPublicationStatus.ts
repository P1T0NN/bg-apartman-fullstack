// MIGRATIONS
import { migrations } from './migrations.js';

/** Restore the host's choice before removing the legacy publication field. */
export const migrateAccommodationPublicationStatus = migrations.define({
	table: 'accommodations',
	migrateOne: async (_ctx, accommodation) => {
		const publicationStatus =
			'publicationIntent' in accommodation ? accommodation.publicationIntent : undefined;
		if (publicationStatus !== 'published' && publicationStatus !== 'unpublished') return;
		return {
			status: accommodation.status === 'deleted' ? ('deleted' as const) : publicationStatus,
			publicationIntent: undefined
		} as const;
	}
});
