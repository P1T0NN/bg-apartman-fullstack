<script lang="ts">
	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import AccommodationAmenityItem from './accommodation-amenities-item.svelte';
	import AccommodationAmenitiesDialog from './accommodation-amenities-dialog/accommodation-amenities-dialog.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';
	import { accommodationAmenitiesStepSchema } from '@/shared/features/accommodations/schemas/accommodationSchemas.js';
	import { POPULAR_AMENITY_KEYS } from '@/shared/features/accommodations/data/accommodationsData.js';

	// UTILS
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	// TYPES
	import type { AmenityKey } from '@/shared/features/accommodations/types/amenityTypes.js';
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const uid = $props.id();
	const errorId = `${uid}-error`;

	const popularKeys = new Set<AmenityKey>(POPULAR_AMENITY_KEYS);

	const selected = $derived(accommodationAmenitiesStepSchema.parse(context.values).amenities);
	const amenities = $derived(getAmenities());
	const popular = $derived(amenities.filter((item) => popularKeys.has(item.key)));
	const additionalCount = $derived(selected.filter((key) => !popularKeys.has(key)).length);

	function toggle(value: AmenityKey, checked: boolean) {
		context.setValue(
			'amenities',
			checked ? [...selected, value] : selected.filter((item) => item !== value)
		);
	}
</script>

<Field.Set
	class="@container/amenities gap-5"
	tabindex={-1}
	aria-invalid={Boolean(context.errors.amenities)}
	aria-describedby={context.errors.amenities ? errorId : undefined}
>
	<Field.Legend class="mb-5 w-full">
		<span class="flex flex-wrap items-baseline justify-between gap-2">
			<span class="text-base font-semibold">
				{m['AddAccommodationPage.AccommodationProgress.amenities']()}
			</span>
			<span class="text-sm font-normal text-muted-foreground tabular-nums" role="status">
				{m['AccommodationsFeature.AccommodationAmenities.selected']({ count: selected.length })}
			</span>
		</span>
	</Field.Legend>

	<Field.Set class="gap-3">
		<Field.Legend variant="label" class="mb-3 w-full border-b pb-3 text-muted-foreground">
			{m['AccommodationsFeature.AccommodationAmenities.popular']()}
		</Field.Legend>

		<Field.Group class="grid grid-cols-1 gap-x-4 gap-y-1 @min-[28rem]/amenities:grid-cols-2">
			{#each popular as item (item.key)}
				<AccommodationAmenityItem
					label={item.label}
					icon={item.icon}
					checked={selected.includes(item.key)}
					disabled={context.disabled}
					onChange={(checked) => toggle(item.key, checked)}
				/>
			{/each}
		</Field.Group>
	</Field.Set>

	<div class="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
		<AccommodationAmenitiesDialog
			{selected}
			{additionalCount}
			disabled={context.disabled}
			onSave={(value) => context.setValue('amenities', value)}
		/>

		{#if additionalCount}
			<span class="text-sm text-muted-foreground">
				{m['AccommodationsFeature.AccommodationAmenities.additional']({ count: additionalCount })}
			</span>
		{/if}
	</div>

	{#if context.errors.amenities}
		<Field.Error id={errorId}>{context.errors.amenities}</Field.Error>
	{/if}
</Field.Set>
