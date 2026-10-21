<script lang="ts">
	// COMPONENTS
	import Header from '@/components/ui/custom-components/header/header.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-svh flex-col">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
