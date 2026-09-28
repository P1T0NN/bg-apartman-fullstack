<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Spinner } from '@/components/ui/spinner';
</script>

<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
	<div class="rounded-full border bg-background p-4 shadow-sm">
		<Spinner class="size-6" aria-label={m['SearchPage.SearchMap.loading']()} />
	</div>
</div>
