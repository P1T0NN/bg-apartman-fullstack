<script lang="ts">
	// COMPONENTS
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';

	// CONFIG
	import { ACCOMMODATION_FILTER_DEFS } from '@/features/accommodations/data/accommodationFilterDefs.js';
	import { ACCOMMODATION_TYPES } from '@/shared/features/accommodations/data/accommodationsData.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	let { value = $bindable() }: { value: string } = $props();
	const uid = $props.id();
</script>

<div id={`${uid}-type`} class="flex scroll-mt-24 flex-col gap-3">
	<label class="font-semibold" for={`${uid}-type-select`}>
		{m['SearchPage.SearchFiltersType.type']()}
	</label>
	<NativeSelect
		id={`${uid}-type-select`}
		options={ACCOMMODATION_FILTER_DEFS[0].options}
		{value}
		onchange={(type) => {
			value = ACCOMMODATION_TYPES.find((value) => value === type) ?? '';
		}}
	/>
</div>
