// LIBRARIES
import { z } from 'zod';

// CONFIG
import { m } from '@/lib/paraglide/messages';
import { getLocale } from '@/lib/paraglide/runtime';
import {
	accommodationBasicInfoSchema,
	accommodationLocationSchema,
	accommodationAmenitiesStepSchema,
	accommodationPhotosSchema,
	accommodationPricingSchema,
	accommodationRulesSchema
} from '@/shared/features/accommodations/schemas/accommodationSchemas.js';
import { ACCOMMODATION_TYPES } from '@/shared/features/accommodations/types/accommodationTypes.js';
import { STORAGE_CONFIG } from '@/shared/features/storage/config.js';

// UTILS
import { getCountryOptions } from '@/shared/utils/countries.js';
import { getTimeSlots } from '@/utils/getTimeSlots.js';

// TYPES
import type {
	ListingSection,
	MyAccommodationListing
} from '@/shared/features/accommodations/types/accommodationTypes.js';

export function createMyAccommodationTabListingForm(
	accommodation: MyAccommodationListing
): ListingSection[] {
	return [
		{
			id: 'basics',
			title: m['MyAccommodationPage.MyAccommodationTabListingSections.basics'](),
			description: m['MyAccommodationPage.MyAccommodationTabListingSections.basicsHint'](),
			icon: 'icon-[lucide--house]',
			group: 'property',
			schema: accommodationBasicInfoSchema.extend({ id: z.string() }),
			values: {
				type: accommodation.type,
				spaceType: accommodation.spaceType,
				maxGuests: accommodation.maxGuests,
				bedrooms: accommodation.bedrooms,
				beds: accommodation.beds,
				bathrooms: accommodation.bathrooms
			},
			fields: [
				{
					kind: 'select',
					name: 'type',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.type'](),
					options: ACCOMMODATION_TYPES.map((value) => ({
						value,
						label: m[`AddAccommodationPage.AddAccommodationFormBasicInfo.${value}`]()
					}))
				},
				{
					kind: 'select',
					name: 'spaceType',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.spaceType'](),
					options: (['entire', 'private', 'shared'] as const).map((value) => ({
						value,
						label: m[`AddAccommodationPage.AddAccommodationFormBasicInfo.${value}`]()
					}))
				},
				{
					kind: 'counter',
					name: 'maxGuests',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.guests'](),
					min: 1,
					max: 100
				},
				{
					kind: 'counter',
					name: 'bedrooms',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.bedrooms'](),
					min: 0,
					max: 100
				},
				{
					kind: 'counter',
					name: 'beds',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.beds'](),
					min: 1,
					max: 100
				},
				{
					kind: 'counter',
					name: 'bathrooms',
					label: m['AddAccommodationPage.AddAccommodationFormBasicInfo.bathrooms'](),
					min: 1,
					max: 100
				}
			]
		},
		{
			id: 'location',
			title: m['MyAccommodationPage.MyAccommodationTabListingSections.location'](),
			description: m['MyAccommodationPage.MyAccommodationTabListingSections.locationHint'](),
			icon: 'icon-[lucide--map-pin]',
			group: 'property',
			schema: accommodationLocationSchema.extend({ id: z.string() }),
			values: {
				address: accommodation.address,
				latitude: accommodation.latitude,
				longitude: accommodation.longitude
			},
			fields: [
				{
					kind: 'input',
					name: 'address.street',
					label: m['Components.GoogleStreetInput.label'](),
					placeholder: m['Components.GoogleStreetInput.placeholder'](),
					required: true
				},
				{
					kind: 'input',
					name: 'address.streetNumber',
					label: m['AddAccommodationPage.AddAccommodationFormLocation.streetNumber'](),
					placeholder:
						m['AddAccommodationPage.AddAccommodationFormLocation.streetNumberPlaceholder'](),
					required: true
				},
				{
					kind: 'input',
					name: 'address.city',
					label: m['AddAccommodationPage.AddAccommodationFormLocation.city'](),
					placeholder: m['AddAccommodationPage.AddAccommodationFormLocation.cityPlaceholder'](),
					required: true
				},
				{
					kind: 'select',
					name: 'address.country',
					label: m['AddAccommodationPage.AddAccommodationFormLocation.country'](),
					options: getCountryOptions(getLocale()),
					required: true
				},
				{
					kind: 'input',
					name: 'address.postalCode',
					label: m['AddAccommodationPage.AddAccommodationFormLocation.postalCode'](),
					placeholder:
						m['AddAccommodationPage.AddAccommodationFormLocation.postalCodePlaceholder']()
				}
			]
		},
		{
			id: 'amenities',
			title: m['MyAccommodationPage.MyAccommodationTabListingSections.amenities'](),
			description: m['MyAccommodationPage.MyAccommodationTabListingSections.amenitiesHint'](),
			icon: 'icon-[lucide--wifi]',
			group: 'property',
			schema: accommodationAmenitiesStepSchema.extend({ id: z.string() }),
			values: { amenities: accommodation.amenities },
			fields: []
		},
		{
			id: 'photos',
			title: m['MyAccommodationPage.MyAccommodationTabListingSections.photos'](),
			description: m['MyAccommodationPage.MyAccommodationTabListingSections.photosHint'](),
			icon: 'icon-[lucide--images]',
			group: 'property',
			schema: accommodationPhotosSchema.extend({ id: z.string() }),
			values: {
				name: accommodation.name,
				description: accommodation.description,
				imageKeys: accommodation.imageKeys,
				imageUrls: accommodation.imageUrls
			},
			fields: [
				{
					kind: 'input',
					name: 'name',
					label: m['AddAccommodationPage.AddAccommodationFormPhotos.name'](),
					placeholder: m['AddAccommodationPage.AddAccommodationFormPhotos.namePlaceholder'](),
					maxLength: 100,
					required: true
				},
				{
					kind: 'textarea',
					name: 'description',
					label: m['AddAccommodationPage.AddAccommodationFormPhotos.description'](),
					placeholder:
						m['AddAccommodationPage.AddAccommodationFormPhotos.descriptionPlaceholder'](),
					rows: 6,
					required: true
				},
				{
					kind: 'upload',
					name: 'imageKeys',
					label: m['AddAccommodationPage.AddAccommodationForm.images'](),
					mode: 'multiple',
					accept: STORAGE_CONFIG.allowedImageTypes.join(',')
				}
			]
		},
		{
			id: 'pricing',
			title: m['MyAccommodationPage.MyAccommodationTabListingSections.pricing'](),
			description: m['MyAccommodationPage.MyAccommodationTabListingSections.pricingHint'](),
			icon: 'icon-[lucide--banknote]',
			group: 'booking',
			schema: accommodationPricingSchema.extend({ id: z.string() }),
			values: {
				nightlyPrice: accommodation.pricePerNightMinor / 100,
				minimumStay: accommodation.minimumStay,
				maximumStay: accommodation.maximumStay
			},
			fields: [
				{
					kind: 'input',
					name: 'nightlyPrice',
					type: 'number',
					label: m['AddAccommodationPage.AddAccommodationFormPricing.nightlyPrice'](),
					placeholder:
						m['AddAccommodationPage.AddAccommodationFormPricing.nightlyPricePlaceholder'](),
					min: 0.01,
					max: 100000,
					step: 0.01,
					required: true
				},
				{
					kind: 'input',
					name: 'minimumStay',
					type: 'number',
					label: m['AddAccommodationPage.AddAccommodationFormPricing.minimumStay'](),
					placeholder:
						m['AddAccommodationPage.AddAccommodationFormPricing.minimumStayPlaceholder'](),
					min: 1,
					max: 365,
					required: true
				},
				{
					kind: 'input',
					name: 'maximumStay',
					type: 'number',
					label: m['AddAccommodationPage.AddAccommodationFormPricing.maximumStay'](),
					placeholder:
						m['AddAccommodationPage.AddAccommodationFormPricing.maximumStayPlaceholder'](),
					min: 1,
					max: 365
				}
			]
		},
		{
			id: 'rules',
			title: m['MyAccommodationPage.MyAccommodationTabListingSections.rules'](),
			description: m['MyAccommodationPage.MyAccommodationTabListingSections.rulesHint'](),
			icon: 'icon-[lucide--clipboard-list]',
			group: 'booking',
			schema: accommodationRulesSchema.extend({ id: z.string() }),
			values: {
				checkInStart: accommodation.checkInStart,
				checkInEnd: accommodation.checkInEnd,
				checkOut: accommodation.checkOut,
				smokingAllowed: accommodation.smokingAllowed,
				petsAllowed: accommodation.petsAllowed,
				partiesAllowed: accommodation.partiesAllowed,
				houseRules: accommodation.houseRules
			},
			fields: [
				{
					kind: 'select',
					name: 'checkInStart',
					label: m['AddAccommodationPage.AddAccommodationFormRules.checkInStart'](),
					options: getTimeSlots()
				},
				{
					kind: 'select',
					name: 'checkInEnd',
					label: m['AddAccommodationPage.AddAccommodationFormRules.checkInEnd'](),
					options: getTimeSlots()
				},
				{
					kind: 'select',
					name: 'checkOut',
					label: m['AddAccommodationPage.AddAccommodationFormRules.checkOut'](),
					options: getTimeSlots()
				}
			]
		}
	];
}
