<script lang="ts">
	// COMPONENTS
	import AccommodationCardLoading from '@/features/accommodations/components/accommodation-card/accommodation-card-loading.svelte';
</script>

<div
	class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-5"
	aria-hidden="true"
>
	{#each Array(6)}
		<AccommodationCardLoading />
	{/each}
</div>
