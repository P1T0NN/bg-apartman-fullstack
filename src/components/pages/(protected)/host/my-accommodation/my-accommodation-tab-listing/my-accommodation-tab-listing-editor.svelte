<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import AccommodationReservationRulesField from '@/features/accommodations/components/accommodation-reservation-rules/accommodation-reservation-rules-field.svelte';
	import AccommodationBookingModeField from '@/features/accommodations/components/accommodation-booking-mode/accommodation-booking-mode-field.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import FormSelect from '@/components/ui/custom-components/form/form-select.svelte';
	import FormTextarea from '@/components/ui/custom-components/form/form-textarea.svelte';
	import AccommodationAmenities from '@/features/accommodations/components/accommodation-amenities/accommodation-amenities.svelte';
	import CardSwitch from '@/components/ui/custom-components/card-switch/card-switch.svelte';
	import AccommodationTimeZone from '@/features/accommodations/components/accommodation-time-zone/accommodation-time-zone.svelte';
	import AccommodationCancellationPolicy from '@/features/accommodations/components/accommodation-cancellation-policy/accommodation-cancellation-policy.svelte';
	import MyAccommodationTabListingLocation from './my-accommodation-tab-listing-location.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import MyAccommodationTabListingSaveButton from './my-accommodation-tab-listing-save-button.svelte';

	// HOOKS
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// TYPES
	import type { Id } from '@convex/_generated/dataModel';
	import type { EditAccommodationListingSection } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	let {
		section,
		onclose
	}: {
		section: EditAccommodationListingSection;
		onclose: () => void;
	} = $props();

	// SAFETY: Convex validates the untrusted route ID before running the mutation.
	const accommodationId = $derived(page.params.id as Id<'accommodations'>);
	// SAFETY: Snapshot preserves this section's plain form values while copying nested data.

	const form = useFormChanges(
		() => $state.snapshot<object>(section.values) as typeof section.values
	);

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
			icon: 'icon-[lucide--cigarette]',
			label: m['AddAccommodationPage.AddAccommodationFormRules.smokingAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.smokingAllowedHint']()
		},
		{
			name: 'petsAllowed',
			icon: 'icon-[lucide--paw-print]',
			label: m['AddAccommodationPage.AddAccommodationFormRules.petsAllowed'](),
			description: m['AddAccommodationPage.AddAccommodationFormRules.petsAllowedHint']()
		},
		{
			name: 'partiesAllowed',
			icon: 'icon-[lucide--party-popper]',
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
	<Button class="w-fit" onclick={onclose}>
		<span class="icon-[lucide--arrow-left]" data-icon="inline-start" aria-hidden="true"></span>
		{m['MyAccommodationPage.MyAccommodationTabListingEditor.back']()}
	</Button>

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
		fields={section.id === 'rules' ? [] : section.fields}
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
			{#if section.id === 'cancellation-policy'}
				<AccommodationCancellationPolicy {context} />
			{/if}

			{#if section.id === 'amenities'}
				<AccommodationAmenities {context} />
			{/if}

			{#if section.id === 'rules'}
				<Field.Group>
					<Field.Set class="rounded-xl border p-5">
						<Field.Legend class="px-1">
							{m['AccommodationsFeature.BookingMode.preferences']()}
						</Field.Legend>
						<AccommodationBookingModeField {context} />
						<AccommodationReservationRulesField {context} />
					</Field.Set>
					<AccommodationTimeZone {context} />
					{#each section.fields.filter((field) => field.kind === 'select') as field (field.name)}
						<FormSelect
							{field}
							value={context.inputValue(field.name)}
							error={context.errors[field.name]}
							disabled={context.disabled}
							onValueChange={(value) => context.setValue(field.name, value)}
						/>
					{/each}

					<Separator />
					<Field.Set>
						<Field.Legend>
							{m['AccommodationPage.AccommodationDetailsRules.houseRules']()}
						</Field.Legend>
						{#each ruleToggles as rule (rule.name)}
							<CardSwitch
								icon={rule.icon}
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
					</Field.Set>
				</Field.Group>
			{/if}
			{#if section.id === 'location'}
				<MyAccommodationTabListingLocation {context} />
			{/if}
		{/snippet}

		<div
			class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4"
		>
			<Button type="button" variant="outline" onclick={onclose}>
				{m['MyAccommodationPage.MyAccommodationTabListingEditor.cancel']()}
			</Button>
			<MyAccommodationTabListingSaveButton {submitting} />
		</div>
	</Form>
</div>
