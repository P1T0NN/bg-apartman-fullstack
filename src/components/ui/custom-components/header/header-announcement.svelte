<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import ButtonLink from '@/components/ui/custom-components/button-link/button-link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';

	// DATA
	import { LOYALTY_LEVELS } from '@/shared/features/loyalty/data/loyaltyData.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	const maxDiscount = Math.max(...LOYALTY_LEVELS.map((tier) => tier.discount));
</script>

<aside
	aria-label={m['Components.HeaderAnnouncement.title']()}
	class="border-b border-success-foreground/20 bg-success py-0.5 text-success-foreground"
>
	<Section as="div" size="none" containerClass="flex items-center justify-between gap-3">
		<p class="min-w-0 text-xs leading-4">
			<strong class="block font-semibold md:inline">
				{m['Components.HeaderAnnouncement.title']()}
			</strong>

			<span class="sm:hidden">
				{m['Components.HeaderAnnouncement.mobileDescription']({ discount: maxDiscount })}
			</span>

			<span class="hidden sm:inline md:ml-2">
				{m['Components.HeaderAnnouncement.description']({ discount: maxDiscount })}
			</span>
		</p>

		<ButtonLink
			href={`${UNPROTECTED_PAGE_ENDPOINTS.ROOT}#loyalty`}
			variant="link"
			class="h-auto min-h-6 shrink-0 gap-1 p-0 text-xs leading-4 text-success-foreground underline underline-offset-4 hover:underline focus-visible:border-success-foreground focus-visible:ring-success-foreground/40"
		>
			{m['Components.HeaderAnnouncement.benefits']()}
			<span class="icon-[lucide--arrow-right] size-3" aria-hidden="true"></span>
		</ButtonLink>
	</Section>
</aside>
