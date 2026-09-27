<script lang="ts">
	import { resolve } from '$app/paths';
	import { z } from 'zod';

	// COMPONENTS
	import AddAccommodationContinueButton from './add-accommodation-continue-button.svelte';
	import FormInput from '@/components/ui/custom-components/form/form-input.svelte';
	import FormSelect from '@/components/ui/custom-components/form/form-select.svelte';
	import GoogleMap from '@/components/ui/custom-components/google-components/google-map/google-map.svelte';
	import GoogleStreetInput from '@/components/ui/custom-components/google-components/google-street-input/google-street-input.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// CONFIG
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { getCountryOptions } from '@/shared/utils/countries.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// TYPES
	import type {
		FormFieldContext,
		FormValue,
		InputField
	} from '@/components/ui/custom-components/form/formTypes.js';
	import type { Attachment } from 'svelte/attachments';

	const positionSchema = z.object({
		lat: z.number().finite().min(-90).max(90),
		lng: z.number().finite().min(-180).max(180)
	});
	const geocodeResponseSchema = z.object({ position: positionSchema.nullable() });

	let { context }: { context: FormFieldContext<FormValue> } = $props();

	const form = getAccommodationFormContext();
	const address = $derived({
		street: context.inputValue('address.street').trim(),
		streetNumber: context.inputValue('address.streetNumber').trim(),
		city: context.inputValue('address.city').trim(),
		postalCode: context.inputValue('address.postalCode').trim(),
		country: context.inputValue('address.country').trim()
	});
	const addressKey = $derived(JSON.stringify(address));
	const addressComplete = $derived(
		address.street.length >= 3 && address.city.length >= 2 && address.country.length >= 2
	);
	const position = $derived.by(() => {
		if (form.state.pinAddress !== addressKey) return null;
		const parsed = positionSchema.safeParse({
			lat: context.getValue('latitude'),
			lng: context.getValue('longitude')
		});
		return parsed.success ? parsed.data : null;
	});
	let mapStatus = $state<'idle' | 'searching' | 'placed' | 'noResult' | 'failed'>('idle');

	function setPosition(point: { lat: number; lng: number }) {
		context.setValue('latitude', point.lat);
		context.setValue('longitude', point.lng);
		form.state.pinAddress = addressKey;
		mapStatus = 'placed';
	}

	function locateAddress(key: string): Attachment<HTMLElement> {
		return () => {
			if (form.state.pinAddress === key) {
				mapStatus = 'placed';
				return;
			}

			if (
				context.getValue('latitude') !== undefined ||
				context.getValue('longitude') !== undefined
			) {
				context.setValue('latitude', undefined);
				context.setValue('longitude', undefined);
			}
			form.state.pinAddress = '';
			if (!addressComplete) {
				mapStatus = 'idle';
				return;
			}

			mapStatus = 'searching';
			const controller = new AbortController();
			let cancelled = false;
			const timeout = setTimeout(async () => {
				try {
					const response = await fetch(resolve('/api/geocode'), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							street: address.street,
							streetNumber: address.streetNumber,
							city: address.city,
							postalCode: address.postalCode,
							country: address.country
						}),
						signal: controller.signal
					});
					if (!response.ok) throw new Error('Geocoding failed');
					const result = geocodeResponseSchema.parse(await response.json());
					if (cancelled) return;
					if (result.position) setPosition(result.position);
					else mapStatus = 'noResult';
				} catch {
					if (!cancelled) mapStatus = 'failed';
				}
			}, 600);

			return () => {
				cancelled = true;
				clearTimeout(timeout);
				controller.abort();
			};
		};
	}

	const streetNumberField = $derived<InputField>({
		kind: 'input',
		name: 'address.streetNumber',
		label: m['AddAccommodationPage.AddAccommodationFormLocation.streetNumber'](),
		placeholder: m['AddAccommodationPage.AddAccommodationFormLocation.streetNumberPlaceholder'](),
		maxLength: 20,
		required: true
	});
	const cityField = $derived<InputField>({
		kind: 'input',
		name: 'address.city',
		label: m['AddAccommodationPage.AddAccommodationFormLocation.city'](),
		placeholder: m['AddAccommodationPage.AddAccommodationFormLocation.cityPlaceholder'](),
		maxLength: 100,
		required: true
	});
	const postalCodeField = $derived<InputField>({
		kind: 'input',
		name: 'address.postalCode',
		label: m['AddAccommodationPage.AddAccommodationFormLocation.postalCode'](),
		placeholder: m['AddAccommodationPage.AddAccommodationFormLocation.postalCodePlaceholder'](),
		maxLength: 20,
		class: 'max-w-48'
	});
</script>

<Field.Group>
	<Field.Group
		class="@min-[30rem]/field-group:grid @min-[30rem]/field-group:grid-cols-[minmax(0,1fr)_9rem]"
	>
		<GoogleStreetInput {context} />
		<FormInput
			field={streetNumberField}
			value={context.inputValue(streetNumberField.name)}
			error={context.errors[streetNumberField.name]}
			disabled={context.disabled}
			onValueChange={(value) => context.setValue(streetNumberField.name, value)}
		/>
	</Field.Group>

	<Field.Group class="@min-[30rem]/field-group:grid @min-[30rem]/field-group:grid-cols-2">
		<FormInput
			field={cityField}
			value={context.inputValue(cityField.name)}
			error={context.errors[cityField.name]}
			disabled={context.disabled}
			onValueChange={(value) => context.setValue(cityField.name, value)}
		/>
		<FormSelect
			field={{
				kind: 'select',
				name: 'address.country',
				label: m['AddAccommodationPage.AddAccommodationFormLocation.country'](),
				required: true,
				options: getCountryOptions(getLocale())
			}}
			value={context.inputValue('address.country')}
			error={context.errors['address.country']}
			disabled={context.disabled}
			onValueChange={(value) => context.setValue('address.country', value)}
		/>
	</Field.Group>

	<FormInput
		field={postalCodeField}
		value={context.inputValue(postalCodeField.name)}
		error={context.errors[postalCodeField.name]}
		disabled={context.disabled}
		onValueChange={(value) => context.setValue(postalCodeField.name, value)}
	/>
</Field.Group>

<section class="flex flex-col gap-3" {@attach locateAddress(addressKey)}>
	<div>
		<h3 class="font-medium">{m['AddAccommodationPage.AddAccommodationFormLocation.mapTitle']()}</h3>
		<p class="text-sm text-muted-foreground">
			{m['AddAccommodationPage.AddAccommodationFormLocation.mapHint']()}
		</p>
	</div>

	{#if addressComplete}
		<GoogleMap
			{position}
			onPositionChange={setPosition}
			disabled={context.disabled}
			label={m['AddAccommodationPage.AddAccommodationFormLocation.mapTitle']()}
			pinTitle={m['AddAccommodationPage.AddAccommodationFormLocation.mapPinTitle']()}
			loadingText={m['AddAccommodationPage.AddAccommodationFormLocation.mapLoading']()}
			errorText={m['AddAccommodationPage.AddAccommodationFormLocation.mapUnavailable']()}
		/>
	{:else}
		<div
			class="flex h-40 items-center justify-center rounded-xl border bg-muted px-6 text-center text-sm text-muted-foreground"
		>
			{m['AddAccommodationPage.AddAccommodationFormLocation.mapWaiting']()}
		</div>
	{/if}

	{#if mapStatus === 'searching'}
		<p class="text-sm text-muted-foreground" role="status">
			{m['AddAccommodationPage.AddAccommodationFormLocation.mapSearching']()}
		</p>
	{:else if mapStatus === 'noResult' || mapStatus === 'failed'}
		<p class="text-sm text-muted-foreground" role="status">
			{m['AddAccommodationPage.AddAccommodationFormLocation.mapNoResult']()}
		</p>
	{/if}

	{#if context.errors.latitude || context.errors.longitude}
		<Field.Error
			>{m['AddAccommodationPage.AddAccommodationFormLocation.mapPinRequired']()}</Field.Error
		>
	{/if}
</section>

<div class="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background py-4">
	<Button type="button" variant="outline" disabled={context.disabled} onclick={form.back}
		>{m['AddAccommodationPage.AddAccommodationFormLocation.previous']()}</Button
	>

	<AddAccommodationContinueButton errors={context.errors} />
</div>
