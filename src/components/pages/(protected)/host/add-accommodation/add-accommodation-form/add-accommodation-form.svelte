<script lang="ts">
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import AddAccommodationFormBasicInfo from './add-accommodation-form-basic-info.svelte';
	import AddAccommodationFormLocation from './add-accommodation-form-location.svelte';
	import AddAccommodationFormAmenities from './add-accommodation-form-amenities.svelte';
	import AddAccommodationFormPhotos from './add-accommodation-form-photos.svelte';
	import AddAccommodationFormPricing from './add-accommodation-form-pricing.svelte';
	import AddAccommodationFormRules from './add-accommodation-form-rules.svelte';
	import AddAccommodationFormCancellationPolicy from './add-accommodation-form-cancellation-policy.svelte';
	import AddAccommodationFormReview from './add-accommodation-form-review.svelte';

	// CONFIG
	import { api } from '@convex/_generated/api';
	import { ACCOMMODATION_CONFIG } from '@/shared/features/accommodations/config.js';
	import { STORAGE_CONFIG } from '@/shared/features/storage/config.js';
	import { saveAccommodationSchema } from '@/shared/features/accommodations/schemas/accommodationSchemas.js';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { gotoParaglide } from '@/utils/gotoParaglide.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	const { state } = getAccommodationFormContext();
</script>

<fieldset disabled={state.submitting} class="min-w-0">
	<Card.Root class="overflow-visible">
		<Card.Content>
			<Form
				function={api.tables.accommodations.mutations.createAccommodation.createAccommodation}
				schema={saveAccommodationSchema}
				bind:values={state.values}
				bind:uploadFiles={state.files}
				bind:submitting={state.submitting}
				fields={[
					{
						kind: 'upload',
						name: 'imageKeys',
						label: m['AddAccommodationPage.AddAccommodationForm.images'](),
						mode: 'multiple',
						accept: STORAGE_CONFIG.allowedImageTypes.join(','),
						class: state.step === 3 || state.step === 7 ? undefined : 'hidden'
					}
				]}
				onsubmitcapture={(event) => {
					if (state.step === 7) return;
					event.preventDefault();
					event.stopImmediatePropagation();
				}}
				resolveExtraFields={({ uploadedFiles }) => ({
					imageKeys: state.files.map((file, index) => uploadedFiles[index] ?? file.id)
				})}
				onSuccess={() => {
					return gotoParaglide(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS);
				}}
				resetOnSuccess={false}
				successMessage={m['AddAccommodationPage.AddAccommodationForm.published']()}
				errorMessage={m['AddAccommodationPage.AddAccommodationForm.publishError']()}
				uploadNamespace={ACCOMMODATION_CONFIG.uploadNamespace}
			>
				{#snippet customFields(context)}
					{#if state.step === 0}
						<AddAccommodationFormBasicInfo {context} />
					{:else if state.step === 1}
						<AddAccommodationFormLocation {context} />
					{:else if state.step === 2}
						<AddAccommodationFormAmenities {context} />
					{:else if state.step === 3}
						<AddAccommodationFormPhotos {context} />
					{:else if state.step === 4}
						<AddAccommodationFormPricing {context} />
					{:else if state.step === 5}
						<AddAccommodationFormRules {context} />
					{:else if state.step === 6}
						<AddAccommodationFormCancellationPolicy {context} />
					{:else}
						<AddAccommodationFormReview {context} />
					{/if}
				{/snippet}
			</Form>
		</Card.Content>
	</Card.Root>
</fieldset>
