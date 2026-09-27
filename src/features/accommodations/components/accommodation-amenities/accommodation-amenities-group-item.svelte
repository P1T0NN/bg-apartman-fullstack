<script lang="ts">
	// COMPONENTS
	import * as Field from '@/components/ui/field/index.js';
	import AccommodationAmenityItem from './accommodation-amenities-item.svelte';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type {
		AmenityDefinition,
		AmenityKey
	} from '@/shared/features/accommodations/types/amenityTypes.js';

	let {
		label,
		amenities,
		selected,
		count,
		expanded,
		filtering,
		disabled,
		onChange
	}: {
		label: string;
		amenities: (AmenityDefinition & { label: string })[];
		selected: Set<AmenityKey>;
		count: number;
		expanded: boolean;
		filtering: boolean;
		disabled: boolean;
		onChange: (key: AmenityKey, checked: boolean) => void;
	} = $props();
</script>

{#snippet heading()}
	<span class="flex-1 font-medium">{label}</span>
	<span class="text-xs font-normal text-muted-foreground tabular-nums">
		{m['AccommodationsFeature.AccommodationAmenitiesGroupItem.selected']({ count })}
	</span>
{/snippet}

{#snippet items()}
	<Field.Set class="min-w-0">
		<Field.Legend class="sr-only">{label}</Field.Legend>
		<Field.Group class="grid grid-cols-1 gap-x-5 gap-y-1 md:grid-cols-2">
			{#each amenities as item (item.key)}
				<AccommodationAmenityItem
					label={item.label}
					icon={item.icon}
					checked={selected.has(item.key)}
					{disabled}
					compact
					onChange={(checked) => onChange(item.key, checked)}
				/>
			{/each}
		</Field.Group>
	</Field.Set>
{/snippet}

{#if filtering}
	<section class="flex flex-col gap-3">
		<h3 class="flex items-center gap-3 border-b pb-3">{@render heading()}</h3>
		{@render items()}
	</section>
{:else}
	<details open={expanded} class="group/category">
		<summary
			class="flex min-h-12 cursor-pointer list-none items-center gap-3 border-b pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
		>
			{@render heading()}
			<span
				class="icon-[lucide--chevron-down] size-4 shrink-0 text-muted-foreground group-open/category:rotate-180"
				aria-hidden="true"
			></span>
		</summary>
		<div class="pt-3">{@render items()}</div>
	</details>
{/if}
