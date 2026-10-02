<script lang="ts">
	// LIBRARIES
	import { Slider } from 'bits-ui';

	// COMPONENTS
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { formatCurrency } from '@/shared/utils/currency.js';

	let {
		minPrice = $bindable(),
		maxPrice = $bindable()
	}: { minPrice: number | undefined; maxPrice: number } = $props();

	const uid = $props.id();
	const minimumLabel = $derived(m['SearchPage.SearchFiltersPrice.minPrice']({ currency: 'EUR' }));
	const maximumLabel = $derived(m['SearchPage.SearchFiltersPrice.maxPrice']({ currency: 'EUR' }));
	const priceSliderMaximum = $derived(
		Math.max(500, Math.ceil(Math.max(minPrice || 0, maxPrice || 0) / 500) * 500)
	);
	const priceSliderStep = $derived(Math.max(1, Math.round(priceSliderMaximum / 500)));
	const priceSliderEnd = $derived(priceSliderMaximum + priceSliderStep);
	const minimumPriceLabel = $derived(
		formatCurrency(Math.round((minPrice || 0) * 100), getLocale())
	);
	const maximumPriceLabel = $derived(
		maxPrice
			? formatCurrency(Math.round(maxPrice * 100), getLocale())
			: m['SearchPage.SearchFiltersPrice.noMaximum']()
	);
</script>

<fieldset id={`${uid}-price`} class="scroll-mt-24">
	<legend class="mb-4 font-semibold">{m['SearchPage.SearchFiltersPrice.price']()}</legend>
	<output
		id={`${uid}-price-values`}
		for={`${uid}-price-slider ${uid}-min ${uid}-max`}
		class="mb-3 flex items-center justify-between gap-4 text-sm font-medium tabular-nums"
	>
		<span>{minimumPriceLabel}</span>
		<span>{maximumPriceLabel}</span>
	</output>

	<Slider.Root
		id={`${uid}-price-slider`}
		type="multiple"
		min={0}
		max={priceSliderEnd}
		step={priceSliderStep}
		autoSort={false}
		value={[minPrice || 0, maxPrice || priceSliderEnd]}
		onValueChange={(values) => {
			minPrice = Math.min(values[0], priceSliderMaximum);
			maxPrice = values[1] === priceSliderEnd ? 0 : values[1];
		}}
		class="relative mb-5 flex h-11 w-full touch-none items-center select-none"
	>
		<span class="absolute h-2 w-full rounded-full bg-muted" aria-hidden="true"></span>
		<Slider.Range class="absolute h-2 rounded-full bg-primary" />
		<Slider.Thumb
			index={0}
			aria-label={minimumLabel}
			aria-valuetext={minimumPriceLabel}
			class="block size-5 rounded-full border-2 border-primary bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
		/>
		<Slider.Thumb
			index={1}
			aria-label={maximumLabel}
			aria-valuetext={maximumPriceLabel}
			class="block size-5 rounded-full border-2 border-primary bg-background shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
		/>
	</Slider.Root>
	<div class="grid grid-cols-2 gap-4">
		<div class="flex flex-col gap-2">
			<label class="text-sm" for={`${uid}-min`}>{minimumLabel}</label>
			<Input
				id={`${uid}-min`}
				type="number"
				min="0"
				max="1000000"
				step="0.01"
				required
				bind:value={minPrice}
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label class="text-sm" for={`${uid}-max`}>{maximumLabel}</label>
			<Input
				id={`${uid}-max`}
				type="number"
				min="0"
				max="1000000"
				step="0.01"
				placeholder={m['SearchPage.SearchFiltersPrice.noMaximum']()}
				bind:value={
					() => maxPrice || undefined,
					(value) => {
						maxPrice = value ?? 0;
					}
				}
			/>
		</div>
	</div>
</fieldset>
