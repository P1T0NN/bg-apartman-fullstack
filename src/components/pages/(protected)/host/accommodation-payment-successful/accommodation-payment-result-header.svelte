<script lang="ts">
	let {
		title,
		description,
		confirmed
	}: { title: string; description: string; confirmed: boolean } = $props();
</script>

<header class="flex flex-col gap-5">
	<div class="flex size-16 items-center justify-center rounded-full bg-muted" aria-hidden="true">
		{#if confirmed}
			<span class="icon-[lucide--circle-check] size-9 text-success"></span>
		{:else}
			<span class="icon-[lucide--receipt] size-9 text-primary"></span>
		{/if}
	</div>
	<div class="flex flex-col gap-3" aria-live="polite">
		<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
		<p class="max-w-prose text-base leading-relaxed text-muted-foreground">{description}</p>
	</div>
</header>
