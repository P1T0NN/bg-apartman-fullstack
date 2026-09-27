<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// CONTEXT
	import { getAccommodationFormContext } from '@/features/accommodations/context/accommodationFormContext.js';

	// UTILS
	import { accommodationSections } from './accommodation-sections.js';
	import { cn } from '@/utils/utils.js';

	const form = getAccommodationFormContext();
	const sections = $derived(accommodationSections());
</script>

<nav
	aria-label={m['AddAccommodationPage.AccommodationProgress.sections']()}
	class="hidden w-56 shrink-0 xl:block"
>
	<ol class="sticky top-8 flex flex-col gap-1">
		{#each sections as section, index (section.label)}
			{@const completed = index < form.state.furthestStep}
			{@const current = index === form.state.step}
			{@const reachable = index <= form.state.furthestStep}
			<li>
				<button
					type="button"
					class={cn(
						'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
						current ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground',
						reachable ? 'hover:bg-muted/60' : 'cursor-not-allowed opacity-50'
					)}
					disabled={!reachable}
					aria-current={current ? 'step' : undefined}
					onclick={() => form.goTo(index)}
				>
					<span class="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
						{#if current}
							<span class="size-2 rounded-full bg-primary"></span>
						{:else if completed}
							<span class="icon-[lucide--check] size-4 text-primary"></span>
						{/if}
					</span>
					<span class="truncate">{section.label}</span>
				</button>
			</li>
		{/each}
	</ol>
</nav>
