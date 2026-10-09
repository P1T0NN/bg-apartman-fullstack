<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="mb-8 flex flex-col gap-4 sm:mb-10">
	<h1
		class="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl"
	>
		{m['FindBookingPage.FindBookingHeader.title']()}
	</h1>

	<p class="max-w-xl text-lg leading-8 text-pretty text-muted-foreground">
		{m['FindBookingPage.FindBookingHeader.description']()}
	</p>
</header>
