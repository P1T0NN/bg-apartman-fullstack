<script lang="ts">
	// HOOKS
	import { useGoogleMap, type MapMarker, type Position } from './useGoogleMap.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		position,
		markers = [],
		onPositionChange = () => {},
		label,
		pinTitle,
		loadingText,
		errorText,
		disabled = false,
		zoom = 16,
		class: className
	}: {
		position: Position | null;
		markers?: MapMarker[];
		onPositionChange?: (position: Position) => void;
		label: string;
		pinTitle: string;
		loadingText: string;
		errorText: string;
		disabled?: boolean;
		zoom?: number;
		class?: string;
	} = $props();

	const map = useGoogleMap({
		getPosition: () => position,
		getMarkers: () => markers,
		getPinTitle: () => pinTitle,
		getDisabled: () => disabled,
		getZoom: () => zoom,
		onPositionChange: (point) => onPositionChange(point)
	});
</script>

<div
	class={cn('relative h-72 overflow-hidden rounded-xl border bg-muted sm:h-80', className)}
	role="region"
	aria-label={label}
>
	<div
		class="h-full w-full"
		{@attach map.initialize}
		{@attach map.syncPosition}
		{@attach map.syncMarkers}
		{@attach map.syncDisabled}
	></div>

	{#if !map.loaded || map.failed}
		<div
			class="absolute inset-0 flex items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground"
			role="status"
		>
			{map.failed ? errorText : loadingText}
		</div>
	{/if}
</div>
