<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// COMPONENTS
	import MyAccommodationTabListingSectionItem from './my-accommodation-tab-listing-section-item.svelte';

	// UTILS
	import { formatCurrency } from '@/shared/utils/currency.js';
	import { getFormValue } from '@/components/ui/custom-components/form/formValues.js';

	// TYPES
	import { ACCOMMODATION_TYPES } from '@/shared/features/accommodations/types/accommodationTypes.js';
	import type { ListingSection } from '@/shared/features/accommodations/types/accommodationTypes.js';

	let {
		group,
		sections,
		onopen
	}: {
		group: 'property' | 'booking';
		sections: ListingSection[];
		onopen: (id: string) => void;
	} = $props();

	const titleId = $derived(`${group}-sections-title`);

	function summary(section: ListingSection) {
		const values = section.values;
		switch (section.id) {
			case 'basics': {
				const type = ACCOMMODATION_TYPES.find((option) => option === values.type) ?? 'apartment';
				return m['MyAccommodationPage.MyAccommodationTabListingSection.basicsSummary']({
					type: m[`AddAccommodationPage.AddAccommodationFormBasicInfo.${type}`](),
					guests: Number(values.maxGuests),
					bedrooms: Number(values.bedrooms),
					beds: Number(values.beds)
				});
			}
			case 'location':
				return `${getFormValue(values, 'address.city')}, ${getFormValue(values, 'address.country')}`;
			case 'amenities':
				return m['MyAccommodationPage.MyAccommodationTabListingSection.amenitiesSummary']({
					count: Array.isArray(values.amenities) ? values.amenities.length : 0
				});
			case 'photos':
				return m['MyAccommodationPage.MyAccommodationTabListingSection.photosSummary']({
					count: Array.isArray(values.imageKeys) ? values.imageKeys.length : 0
				});
			case 'pricing':
				return m['MyAccommodationPage.MyAccommodationTabListingSection.pricingSummary']({
					price: formatCurrency(Number(values.nightlyPrice) * 100, getLocale()),
					nights: Number(values.minimumStay)
				});
			default:
				return m['MyAccommodationPage.MyAccommodationTabListingSection.rulesSummary']({
					start: String(values.checkInStart),
					end: String(values.checkInEnd),
					checkout: String(values.checkOut)
				});
		}
	}
</script>

<section aria-labelledby={titleId}>
	<h3
		id={titleId}
		class="mb-2 px-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase sm:px-4"
	>
		{m[`MyAccommodationPage.MyAccommodationTabListingSection.${group}`]()}
	</h3>

	<ul class="divide-y">
		{#each sections as section (section.id)}
			<MyAccommodationTabListingSectionItem
				{section}
				summary={summary(section)}
				onopen={() => onopen(section.id)}
			/>
		{/each}
	</ul>
</section>
