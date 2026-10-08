<script lang="ts">
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex flex-col gap-2">
	<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
		{m['BenefitsPage.BenefitsHeader.eyebrow']()}
	</p>
	<h1 class="text-3xl font-semibold tracking-tight">
		{m['BenefitsPage.BenefitsHeader.title']()}
	</h1>
	<p class="max-w-prose text-sm leading-6 text-muted-foreground">
		{m['BenefitsPage.BenefitsHeader.description']()}
	</p>
</header>
