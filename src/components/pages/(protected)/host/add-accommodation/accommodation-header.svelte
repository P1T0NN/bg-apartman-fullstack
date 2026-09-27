<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Progress } from '@/components/ui/progress/index.js';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// UTILS
	import { accommodationSections } from './accommodation-sections.js';

	const form = getAccommodationFormContext();
	const sections = $derived(accommodationSections());
</script>

<header class="flex flex-col gap-4 border-b pb-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold tracking-tight">
			{m['AddAccommodationPage.AccommodationHeader.title']()}
		</h1>
		<p class="text-sm text-muted-foreground">
			{m['AddAccommodationPage.AccommodationHeader.localOnly']()}
		</p>
	</div>

	<div class="flex flex-col gap-2">
		<p class="text-sm font-medium text-muted-foreground">
			{m['AddAccommodationPage.AccommodationProgress.position']({
				current: form.state.step + 1,
				total: sections.length
			})}
		</p>
		
		<p class="text-lg font-medium">{sections[form.state.step].label}</p>

		<Progress
			value={form.state.step + 1}
			max={sections.length}
			class="h-1.5"
			aria-label={sections[form.state.step].label}
		/>
	</div>
</header>

<div class="flex flex-col gap-3 py-6">
	<h2 aria-live="polite" class="text-2xl font-semibold tracking-tight">
		{sections[form.state.step].title}
	</h2>

	<p class="text-muted-foreground">{sections[form.state.step].hint}</p>
</div>
