<script lang="ts">
	// COMPONENTS
	import NativeTooltip from '@/components/ui/native-components/native-tooltip/native-tooltip.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Tooltip test" noindex />

{#snippet tooltipTrigger()}
	<span class="icon-[lucide--info] size-4" aria-hidden="true"></span>
	<span>Hover or focus me</span>
{/snippet}

<main class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
	<header class="flex flex-col gap-2">
		<p class="text-sm text-muted-foreground">Component test</p>
		<h1 class="text-2xl font-semibold tracking-tight">Native tooltip</h1>
		<p class="max-w-prose text-sm text-muted-foreground">
			This uses the native Interest Invoker and Popover APIs when supported. Otherwise NativeTooltip
			lazy-loads the shadcn Tooltip fallback.
		</p>
	</header>

	<section class="flex flex-wrap items-center gap-4 rounded-xl border p-6">
		<NativeTooltip id="tooltip-test" trigger={tooltipTrigger} triggerLabel="Show tooltip">
			The browser handles showing this on hover or keyboard focus.
		</NativeTooltip>

		<span class="text-sm text-muted-foreground">Hover or tab to the trigger.</span>
	</section>
</main>
