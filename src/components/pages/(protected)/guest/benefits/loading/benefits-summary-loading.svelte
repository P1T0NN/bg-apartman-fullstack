<script lang="ts">
	// COMPONENTS
	import TicketCard from '@/components/ui/custom-components/ticket-card/ticket-card.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<!-- Mirrors benefits-summary.svelte so nothing jumps when the data arrives -->
<div aria-hidden="true">
	<TicketCard bodyClass="flex flex-col gap-8" stubClass="flex flex-col gap-3">
		{#snippet body()}
			<div class="flex items-center justify-between gap-3">
				<Skeleton class="h-6 w-40" />
				<Skeleton class="h-5 w-16 rounded-full" />
			</div>

			<div class="flex flex-col gap-6">
				<Skeleton class="h-24 w-40 sm:h-32 sm:w-52" />
				<div class="flex flex-col gap-3">
					<Skeleton class="h-5 w-36" />
					<Skeleton class="h-4 w-56" />
					<Skeleton class="h-4 w-48" />
				</div>
			</div>

			<div
				class="mt-auto flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
			>
				<Skeleton class="h-10 w-full max-w-sm" />
				<Skeleton class="h-12 w-40 rounded-xl" />
			</div>
		{/snippet}

		{#snippet stub()}
			<Skeleton class="h-18 w-20" />
			<Skeleton class="h-4 w-32" />
			<div class="mt-3 flex flex-col gap-3">
				<Skeleton class="h-4 w-full" />
				<Skeleton class="h-2 w-full rounded-full" />
			</div>
			<div class="mt-3 flex flex-col gap-2">
				<Skeleton class="h-3 w-full" />
				<Skeleton class="h-3 w-2/3" />
			</div>
		{/snippet}
	</TicketCard>
</div>
