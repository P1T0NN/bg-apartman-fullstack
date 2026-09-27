<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import FormTextarea from '@/components/ui/custom-components/form/form-textarea.svelte';
	import AccommodationAmenities from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities.svelte';
	import AccommodationRuleCard from '@/features/accommodations/components/accommodation-rule-card/accommodation-rule-card.svelte';
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import MyAccommodationTabListingSaveButton from './my-accommodation-tab-listing-save-button.svelte';

	// CONFIG
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// HOOKS
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { ListingSection } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	let { section, onclose }: { section: ListingSection; onclose: () => void } = $props();

	// SAFETY: Convex validates the untrusted route ID before running the mutation.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);
	const form = useFormChanges(() => structuredClone(section.values));

	// svelte-ignore state_referenced_locally
	// SAFETY: The listing factory seeds this section with the stored photo keys and URLs.
	const savedKeys = Array.isArray(section.values.imageKeys)
		? (section.values.imageKeys as string[])
		: [];
	// svelte-ignore state_referenced_locally
	// SAFETY: Same stored photo keys, resolved to URLs in the same order.
	const savedUrls = Array.isArray(section.values.imageUrls)
		? (section.values.imageUrls as string[])
		: [];
	let files = $state<PreviewFile[]>(
		savedKeys.flatMap((key, index) => {
			const url = savedUrls[index];
			return url ? [{ id: key, key, url }] : [];
		})
	);
	let submitting = $state(false);

	const ruleToggles = $derived([
		{
			name: 'smokingAllowed',
			label: m['AddAccommodationPage.AddAccommodationFormRules.smokingAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.smokingAllowedHint']()
		},
		{
			name: 'petsAllowed',
			label: m['AddAccommodationPage.AddAccommodationFormRules.petsAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.petsAllowedHint']()
		},
		{
			name: 'partiesAllowed',
			label: m['AddAccommodationPage.AddAccommodationFormRules.partiesAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.partiesAllowedHint']()
		}
	]);

	/** Keeps saved photos and uploads in selection order while replacing local files with their uploaded keys. */
	function resolveImageKeys(uploadedFiles: string[]): string[] {
		let uploadedIndex = 0;
		return files.map((file) => file.key ?? uploadedFiles[uploadedIndex++] ?? file.id);
	}
</script>

<div class="flex w-full flex-col gap-6">
	<Button class="w-fit" onclick={onclose}
		><span class="icon-[lucide--arrow-left]" data-icon="inline-start" aria-hidden="true"></span>{m[
			'MyAccommodationPage.MyAccommodationTabListingEditor.back'
		]()}</Button
	>

	<div>
		<h2
			tabindex="-1"
			class="text-2xl font-semibold tracking-tight outline-none"
			{@attach (element) => {
				element.focus();
			}}
		>
			{section.title}
		</h2>

		<p class="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
			{section.description}
		</p>
	</div>

	<Form
		function={api.tables.accommodations.mutations.updateAccommodation.updateAccommodation}
		schema={section.schema}
		fields={section.fields}
		bind:values={form.values}
		bind:uploadFiles={files}
		bind:submitting
		resolveExtraFields={({ uploadedFiles }) => ({
			id: accommodationId,
			...(section.id === 'photos' ? { imageKeys: resolveImageKeys(uploadedFiles) } : {})
		})}
		onSuccess={onclose}
		resetOnSuccess={false}
	>
		{#snippet customFields(context)}
			{#if section.id === 'amenities'}<AccommodationAmenities {context} />{/if}
			{#if section.id === 'rules'}
				<Field.Group>
					{#each ruleToggles as rule (rule.name)}
						<AccommodationRuleCard
							label={rule.label}
							description={rule.description}
							checked={context.checkboxValue(rule.name)}
							disabled={context.disabled}
							onCheckedChange={(checked) => context.setValue(rule.name, checked)}
						/>
					{/each}

					<FormTextarea
						field={{
							kind: 'textarea',
							name: 'houseRules',
							label: m['AddAccommodationPage.AddAccommodationFormRules.houseRules'](),
							placeholder:
								m['AddAccommodationPage.AddAccommodationFormRules.houseRulesPlaceholder'](),
							rows: 4
						}}
						value={context.inputValue('houseRules')}
						error={context.errors['houseRules']}
						disabled={context.disabled}
						onValueChange={(value) => context.setValue('houseRules', value)}
					/>
				</Field.Group>
			{/if}
			{#if section.id === 'location'}
				{@const latitude = context.inputValue('latitude')}
				{@const longitude = context.inputValue('longitude')}
				<section class="flex flex-col gap-3" aria-labelledby="listing-map-title">
					<div>
						<h3 id="listing-map-title" class="font-medium">
							{m['MyAccommodationPage.MyAccommodationTabListingEditor.mapTitle']()}
						</h3>
						<p class="text-sm text-muted-foreground">
							{m['MyAccommodationPage.MyAccommodationTabListingEditor.mapHint']()}
						</p>
					</div>

					<GoogleMap
						position={latitude !== '' && longitude !== ''
							? { lat: Number(latitude), lng: Number(longitude) }
							: null}
						onPositionChange={(point) => {
							context.setValue('latitude', point.lat);
							context.setValue('longitude', point.lng);
						}}
						disabled={context.disabled}
						label={m['MyAccommodationPage.MyAccommodationTabListingEditor.mapTitle']()}
						pinTitle={m['AddAccommodationPage.AddAccommodationFormLocation.mapPinTitle']()}
						loadingText={m['AddAccommodationPage.AddAccommodationFormLocation.mapLoading']()}
						errorText={m['AddAccommodationPage.AddAccommodationFormLocation.mapUnavailable']()}
					/>
				</section>
			{/if}
		{/snippet}

		<div
			class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4"
		>
			<Button type="button" variant="outline" onclick={onclose}
				>{m['MyAccommodationPage.MyAccommodationTabListingEditor.cancel']()}</Button
			>
			<MyAccommodationTabListingSaveButton {submitting} />
		</div>
	</Form>
</div>
