<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime.js';

	// CONTEXTS
	import { getSearchContext } from '@/features/search/context/searchContext.js';

	// COMPONENTS
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';

	// UTILS
	import { formatCompactCurrency } from '@/shared/utils/currency.js';
	import { cn } from '@/utils/utils.js';

	type Position = { lat: number; lng: number };
	type StayMarker = Position & { id: string; name: string; priceMinor: number };

	let {
		destination,
		position,
		markers = [],
		highlightedId = null
	}: {
		destination: string;
		position: Position | null;
		markers?: StayMarker[];
		highlightedId?: string | null;
	} = $props();

	const search = getSearchContext();

	const googleMarkers = $derived(
		markers.map((stay) => ({
			position: { lat: stay.lat, lng: stay.lng },
			title: stay.name,
			content: () => buildStayPin(stay, () => stay.id === highlightedId)
		}))
	);

	function buildStayPin(stay: StayMarker, isHighlighted: () => boolean): HTMLElement {
		const pin = document.createElement('div');
		pin.className = 'flex flex-col items-center';

		const label = document.createElement('div');
		label.className =
			'flex min-w-11 items-center justify-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground whitespace-nowrap shadow-md transition-colors';
		label.textContent = formatCompactCurrency(stay.priceMinor, getLocale());

		const tail = document.createElement('div');
		tail.className =
			'-mt-1.5 size-2.5 rotate-45 border-r border-b border-border bg-background transition-colors';

		pin.append(label, tail);

		$effect(() => {
			const highlighted = isHighlighted();
			label.classList.toggle('border-border', !highlighted);
			label.classList.toggle('border-primary', highlighted);
			label.classList.toggle('bg-background', !highlighted);
			label.classList.toggle('bg-primary', highlighted);
			label.classList.toggle('text-foreground', !highlighted);
			label.classList.toggle('text-primary-foreground', highlighted);
			tail.classList.toggle('border-border', !highlighted);
			tail.classList.toggle('border-primary', highlighted);
			tail.classList.toggle('bg-background', !highlighted);
			tail.classList.toggle('bg-primary', highlighted);
		});

		return pin;
	}
</script>

{#if position}
	<aside
		class={cn(
			'min-[68.75rem]:sticky min-[68.75rem]:top-20 min-[68.75rem]:block',
			search.mapVisible ? 'block' : 'hidden'
		)}
	>
		<GoogleMap
			markers={googleMarkers}
			position={markers.length ? null : position}
			disabled
			zoom={13}
			label={m['SearchPage.mapTitle']({ destination })}
			pinTitle={destination}
			loadingText={m['SearchPage.mapLoading']()}
			errorText={m['SearchPage.mapError']()}
			class="h-[calc(100dvh-17rem)] min-h-96 rounded-2xl sm:h-[calc(100dvh-17rem)] min-[68.75rem]:h-[calc(100dvh-7rem)]"
		/>
	</aside>
{/if}
