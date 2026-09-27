<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import AccommodationHeader from '@/components/pages/(protected)/host/add-accommodation/accommodation-header.svelte';
	import AccommodationSectionNav from '@/components/pages/(protected)/host/add-accommodation/accommodation-section-nav.svelte';
	import AddAccommodationForm from '@/components/pages/(protected)/host/add-accommodation/add-accommodation-form/add-accommodation-form.svelte';

	// HOOKS
	import { createAccommodationForm } from '@/features/accommodations/hooks/useAccommodationForm.svelte.js';

	// CONTEXT
	import { setAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	setAccommodationFormContext(createAccommodationForm());
</script>

<SvelteHead title={m['AddAccommodationPage.title']()} noindex />

<div class="mx-auto w-full max-w-270 px-4 py-8 sm:px-6 lg:px-10">
	<div class="flex flex-col gap-8 xl:mx-auto xl:max-w-230 xl:flex-row xl:gap-14">
		<AccommodationSectionNav />
		<div class="mx-auto flex w-full max-w-160 min-w-0 flex-col">
			<AccommodationHeader />
			<AddAccommodationForm />
		</div>
	</div>
</div>
