// LIBRARIES
import { useMutation } from 'convex-svelte';
import { m } from '@/lib/paraglide/messages';
import { api } from '@convex/_generated/api';

// UTILS
import { toastMessage } from '@/utils/toastMessage.js';

// TYPES
import type { Id } from '@convex/_generated/dataModel';

type FavoriteOverride = {
	viewerId: string;
	favorite: boolean;
};

type FavoriteOverrides = Partial<Record<Id<'accommodations'>, FavoriteOverride>>;

/**
 * Favorite state for a listed set of accommodations. `seedIds` is the server
 * truth for the current list (a search response, for example); toggles sit on
 * top of it optimistically and roll back with a toast when the mutation fails.
 * Visitors trigger `onAuthRequired` instead of a mutation. Pass `seedIds` and
 * `viewerId` as getters so changing inputs stay reactive.
 */
export function useFavorites(options: {
	seedIds?: () => readonly Id<'accommodations'>[];
	viewerId: () => string | null;
	onAuthRequired?: () => void;
}) {
	let overrides = $state<FavoriteOverrides>({});
	let pending = $state<Id<'accommodations'>[]>([]);

	const updateFavoriteStatus = useMutation(
		api.tables.favorites.mutations.updateFavoriteStatus.updateFavoriteStatus
	);

	function isFavorite(accommodationId: Id<'accommodations'>): boolean {
		const viewerId = options.viewerId();
		const override = overrides[accommodationId];
		if (viewerId && override?.viewerId === viewerId) return override.favorite;
		return (options.seedIds?.() ?? []).includes(accommodationId);
	}

	function isPending(accommodationId: Id<'accommodations'>): boolean {
		return pending.includes(accommodationId);
	}

	function writeOverride(
		accommodationId: Id<'accommodations'>,
		viewerId: string,
		favorite: boolean
	): void {
		overrides = { ...overrides, [accommodationId]: { viewerId, favorite } };
	}

	async function toggle(accommodationId: Id<'accommodations'>): Promise<void> {
		const viewerId = options.viewerId();

		if (!viewerId) {
			options.onAuthRequired?.();
			return;
		}
		if (pending.includes(accommodationId)) return;

		const current = overrides[accommodationId];
		const previous = current?.viewerId === viewerId ? current.favorite : undefined;
		const next = !isFavorite(accommodationId);

		writeOverride(accommodationId, viewerId, next);
		pending = [...pending, accommodationId];
		try {
			await updateFavoriteStatus({ accommodationId, favorite: next });
			if (next) {
				toastMessage({
					type: 'success',
					message: m['FavoritesFeature.FavoriteFeedback.added']()
				});
			} else {
				toastMessage({
					type: 'success',
					message: m['FavoritesFeature.FavoriteFeedback.removed'](),
					duration: 6000,
					action: {
						label: m['FavoritesFeature.FavoriteFeedback.undo'](),
						onClick: () => void toggle(accommodationId)
					}
				});
			}
		} catch (error) {
			const nextOverrides = { ...overrides };
			if (previous === undefined) {
				delete nextOverrides[accommodationId];
			} else {
				nextOverrides[accommodationId] = { viewerId, favorite: previous };
			}
			overrides = nextOverrides;
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = pending.filter((id) => id !== accommodationId);
		}
	}

	return {
		isFavorite,
		isPending,
		toggle
	};
}
