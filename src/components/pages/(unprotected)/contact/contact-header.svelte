<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center">
	<h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
		{m['ContactPage.ContactHeader.title']()}
	</h1>

	<p class="text-balance text-muted-foreground">
		{m['ContactPage.ContactHeader.description']()}
	</p>
</header>
