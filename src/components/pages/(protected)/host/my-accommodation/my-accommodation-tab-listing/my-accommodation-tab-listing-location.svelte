<script lang="ts">
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';
	import AccommodationTimeZone from '@/features/accommodations/components/accommodation-time-zone/accommodation-time-zone.svelte';
	import { useAccommodationTimeZone } from '@/features/accommodations/hooks/useAccommodationTimeZone.svelte.js';
	import { m } from '@/lib/paraglide/messages';
	import type {
		FormFieldContext,
		FormValue
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { context }: { context: FormFieldContext<FormValue> } = $props();
	const uid = $props.id();
	const timeZone = useAccommodationTimeZone(() => context);
	const position = $derived(
		context.inputValue('latitude') !== '' && context.inputValue('longitude') !== ''
			? {
					lat: Number(context.inputValue('latitude')),
					lng: Number(context.inputValue('longitude'))
				}
			: null
	);
</script>

<section class="flex flex-col gap-3" aria-labelledby={`${uid}-title`}>
	<div>
		<h3 id={`${uid}-title`} class="font-medium">
			{m['MyAccommodationPage.MyAccommodationTabListingEditor.mapTitle']()}
		</h3>
		<p class="text-sm text-muted-foreground">
			{m['MyAccommodationPage.MyAccommodationTabListingEditor.mapHint']()}
		</p>
	</div>
	<GoogleMap
		{position}
		onPositionChange={(point) => {
			void timeZone.setPosition(point);
		}}
		disabled={context.disabled}
		label={m['MyAccommodationPage.MyAccommodationTabListingEditor.mapTitle']()}
		pinTitle={m['AddAccommodationPage.AddAccommodationFormLocation.mapPinTitle']()}
		loadingText={m['AddAccommodationPage.AddAccommodationFormLocation.mapLoading']()}
		errorText={m['AddAccommodationPage.AddAccommodationFormLocation.mapUnavailable']()}
	/>
	<AccommodationTimeZone
		{context}
		pending={timeZone.pending}
		error={timeZone.error}
		onretry={position ? timeZone.retry : undefined}
	/>
</section>
