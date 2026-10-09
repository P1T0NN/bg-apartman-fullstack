<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex flex-col gap-4">
	<p class="-mb-1 text-sm font-medium text-muted-foreground">
		{m['BenefitsPage.BenefitsHeader.eyebrow']()}
	</p>

	<h1 class="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
		{m['BenefitsPage.BenefitsHeader.title']()}
	</h1>

	<p class="max-w-xl text-lg leading-8 text-pretty text-muted-foreground">
		{m['BenefitsPage.BenefitsHeader.description']()}
	</p>
</header>
