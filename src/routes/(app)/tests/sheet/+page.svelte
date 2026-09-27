<script lang="ts">
	import NativeSheet from '@/components/ui/native-components/native-sheet/native-sheet.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
</script>

<SvelteHead title="Sheet test" noindex />

{#snippet menuTrigger()}
	<span class="icon-[lucide--menu] size-5" aria-hidden="true"></span>
	<span>Open sheet</span>
{/snippet}

<main class="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
	<header class="flex flex-col gap-2">
		<p class="text-sm text-muted-foreground">Component test</p>
		<h1 class="text-2xl font-semibold tracking-tight">Native sheet</h1>
		<p class="max-w-prose text-sm text-muted-foreground">
			This uses the native dialog path when the browser supports every required capability.
			Otherwise NativeSheet lazy-loads the shadcn Sheet fallback.
		</p>
	</header>

	<NativeSheet id="sheet-test" label="Sheet test" trigger={menuTrigger} triggerLabel="Open sheet">
		<div class="flex flex-col gap-6">
			<header class="flex flex-col gap-1">
				<p class="text-lg font-semibold">Native navigation</p>
				<p class="text-sm text-sidebar-foreground/70">Close with Escape or an outside click.</p>
			</header>

			<nav aria-label="Test navigation" class="flex flex-col gap-1">
				<a
					href="/tests/data-list"
					class="rounded-md px-3 py-2 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
					>Data list</a
				>
				<a
					href="/tests/data-table"
					class="rounded-md px-3 py-2 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
					>Data table</a
				>
				<a
					href="/tests/data-list-infinite"
					class="rounded-md px-3 py-2 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
					>Infinite list</a
				>
			</nav>
		</div>
	</NativeSheet>

	<section class="rounded-xl border bg-muted/30 p-4 text-sm">
		<p>Use an older browser to exercise the Sheet fallback.</p>
	</section>
</main>
