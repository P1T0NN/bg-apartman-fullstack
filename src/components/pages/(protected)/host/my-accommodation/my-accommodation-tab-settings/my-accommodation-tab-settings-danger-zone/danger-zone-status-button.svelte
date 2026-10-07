<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useMutation, useQuery } from 'convex-svelte';

	// MESSAGES
	import { m } from '@/lib/paraglide/messages.js';

	// CONVEX
	import { api } from '@convex/_generated/api.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';

	// SAFETY: Convex validates the untrusted route ID before running the query.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);
	const accommodation = useQuery(
		api.tables.accommodations.queries.fetchMyAccommodation.fetchMyAccommodation,
		() => ({ id: accommodationId })
	);
	const updatePublishStatus = useMutation(
		api.tables.accommodations.mutations.updateAccommodationPublishStatus
			.updateAccommodationPublishStatus
	);

	const isPublished = $derived(accommodation.data?.status !== 'unpublished');

	let pending = $state(false);

	async function togglePublishStatus(): Promise<void> {
		const wasPublished = isPublished;
		pending = true;
		try {
			await updatePublishStatus({
				id: accommodationId,
				status: wasPublished ? 'unpublished' : 'published'
			});

			toastMessage({
				type: 'success',
				message: wasPublished
					? m['MyAccommodationPage.DangerZoneStatusButton.unpublishedToast']()
					: m['MyAccommodationPage.DangerZoneStatusButton.publishedToast']()
			});
		} catch (error) {
			toastMessage({ type: 'error', error, message: m['ErrorMessages.unexpected']() });
		} finally {
			pending = false;
		}
	}
</script>

<Button
	variant="outline"
	disabled={pending || !accommodation.data}
	onclick={() => void togglePublishStatus()}
>
	{#if pending}
		<Spinner data-icon="inline-start" />
	{/if}

	{isPublished
		? m['MyAccommodationPage.DangerZoneStatusButton.unpublish']()
		: m['MyAccommodationPage.DangerZoneStatusButton.publish']()}
</Button>
