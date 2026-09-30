<script lang="ts">
	// CONFIG
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import AccommodationAmenitiesGroupItem from '../accommodation-amenities-group-item.svelte';
	import AccommodationAmenitiesDialogEmpty from './accommodation-amenities-dialog-empty.svelte';
	import AccommodationAmenitiesDialogFooter from './accommodation-amenities-dialog-footer.svelte';
	import AccommodationAmenitiesDialogHeader from './accommodation-amenities-dialog-header.svelte';

	// HOOKS
	import { useAmenityDialog } from '@/features/accommodations/hooks/useAmenityDialog.svelte.js';

	// UTILS
	import { IsMobile } from '@/hooks/is-mobile.svelte.js';
	import { getAmenities } from '@/shared/features/accommodations/utils/getAmenities.js';

	// TYPES
	import type { AmenityKey } from '@/shared/features/accommodations/types/amenityTypes.js';

	let {
		selected,
		additionalCount,
		triggerLabel,
		disabled = false,
		onSave
	}: {
		selected: AmenityKey[];
		additionalCount: number;
		triggerLabel?: string;
		disabled?: boolean;
		onSave: (selected: AmenityKey[]) => void;
	} = $props();

	const uid = $props.id();
	const titleId = `${uid}-manager-title`;
	const dialog = useAmenityDialog({
		getSelected: () => selected,
		onSave: (keys) => onSave(keys)
	});
	const mobile = new IsMobile();

	const amenities = $derived(getAmenities());
	const selectedKeys = $derived(new Set(dialog.state.draft));
	const query = $derived(dialog.state.search.trim().toLocaleLowerCase());
	const filtering = $derived(Boolean(query) || dialog.state.selectedOnly);

	const groups = $derived(
		[
			{
				key: 'essentials',
				label: m['AccommodationsFeature.AccommodationAmenitiesDialog.essentials']()
			},
			{ key: 'work', label: m['AccommodationsFeature.AccommodationAmenitiesDialog.work']() },
			{ key: 'outdoors', label: m['AccommodationsFeature.AccommodationAmenitiesDialog.outdoors']() }
		]
			.map((group) => ({
				...group,
				count: amenities.filter((item) => item.group === group.key && selectedKeys.has(item.key))
					.length,
				items: amenities.filter(
					(item) =>
						item.group === group.key &&
						(!dialog.state.selectedOnly || selectedKeys.has(item.key)) &&
						item.label.toLocaleLowerCase().includes(query)
				)
			}))
			.filter((group) => group.items.length)
	);
	const resultCount = $derived(groups.reduce((count, group) => count + group.items.length, 0));
</script>

<NativeDialog
	aria-labelledby={titleId}
	class="h-dvh max-h-dvh max-w-none overflow-hidden rounded-none border-0 md:h-[85dvh] md:max-h-[85dvh] md:w-[calc(100%-3rem)] md:max-w-225 md:rounded-2xl md:border"
>
	{#snippet trigger({ open })}
		<Button type="button" variant="outline" {disabled} onclick={() => dialog.open(open)}>
			<span class="icon-[lucide--sliders-horizontal]" aria-hidden="true" data-icon="inline-start"
			></span>

			{triggerLabel ??
				(additionalCount
					? m['AccommodationsFeature.AccommodationAmenitiesDialog.edit']()
					: m['AccommodationsFeature.AccommodationAmenitiesDialog.addMore']())}
		</Button>
	{/snippet}

	{#snippet children({ close })}
		<div class="flex h-full min-h-0 flex-col">
			<AccommodationAmenitiesDialogHeader {dialog} {titleId} onClose={close} />

			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-8 md:py-6">
				<p class="sr-only" role="status">
					{m['AccommodationsFeature.AccommodationAmenitiesDialog.results']({
						count: resultCount
					})}
				</p>

				<div class="flex flex-col gap-7">
					{#each groups as group, index (group.key)}
						<AccommodationAmenitiesGroupItem
							label={group.label}
							amenities={group.items}
							selected={selectedKeys}
							count={group.count}
							expanded={!mobile.current || index === 0}
							{filtering}
							{disabled}
							onChange={dialog.toggle}
						/>
					{:else}
						<AccommodationAmenitiesDialogEmpty {dialog} />
					{/each}
				</div>
			</div>

			<AccommodationAmenitiesDialogFooter {dialog} {disabled} onClose={close} />
		</div>
	{/snippet}
</NativeDialog>
