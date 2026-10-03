// LIBRARIES
import { m } from '@/lib/paraglide/messages';

export function accommodationSections() {
	return [
		{
			label: m['AddAccommodationPage.AccommodationProgress.basics'](),
			title: m['AddAccommodationPage.AccommodationHeader.basicsTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.basicsHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.location'](),
			title: m['AddAccommodationPage.AccommodationHeader.locationTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.locationHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.amenities'](),
			title: m['AddAccommodationPage.AccommodationHeader.amenitiesTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.amenitiesHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.photos'](),
			title: m['AddAccommodationPage.AccommodationHeader.photosTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.photosHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.pricing'](),
			title: m['AddAccommodationPage.AccommodationHeader.pricingTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.pricingHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.rules'](),
			title: m['AddAccommodationPage.AccommodationHeader.rulesTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.rulesHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.cancellationPolicy'](),
			title: m['AddAccommodationPage.AccommodationHeader.cancellationPolicyTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.cancellationPolicyHint']()
		},
		{
			label: m['AddAccommodationPage.AccommodationProgress.review'](),
			title: m['AddAccommodationPage.AccommodationHeader.reviewTitle'](),
			hint: m['AddAccommodationPage.AccommodationHeader.reviewHint']()
		}
	];
}
