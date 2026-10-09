<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// LIBRARIES
	import { slide } from 'svelte/transition';

	// COMPONENTS
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import SearchCard from '@/components/ui/custom-components/search-card/search-card.svelte';
	import SearchToolbar from '@/components/pages/(unprotected)/search/search-filters/search-toolbar/search-toolbar.svelte';
	import SearchHeaderUserContent from './search-header-user-content.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const navItems = $derived([
		{ href: '/' as const, label: m['Components.Header.home']() },
		{ href: '/contact' as const, label: m['Components.Header.contact']() }
	]);

	let { initialLocation = '' }: { initialLocation?: string } = $props();

	let expanded = $state(false);
	let headerElement = $state<HTMLElement>();

	function collapseOnOutsideClick(event: PointerEvent): void {
		if (!expanded) return;
		const target = event.target;
		if (target instanceof Node && headerElement?.contains(target)) return;
		expanded = false;
	}

	function collapseOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape') expanded = false;
	}
</script>

<svelte:window onpointerdown={collapseOnOutsideClick} onkeydown={collapseOnEscape} />

<header
	{@attach (element) => {
		headerElement = element;
		return () => {
			headerElement = undefined;
		};
	}}
	class="sticky top-0 z-40 border-b border-header-foreground/10 bg-header text-header-foreground"
>
	<div
		class="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 min-[68.75rem]:px-8"
	>
		<a href={resolve('/')} class="flex items-center text-lg font-semibold tracking-tight">
			<Logo />
		</a>

		{#if expanded}
			<nav class="flex items-center gap-5">
				{#each navItems as item (item.href)}
					<a
						href={resolve(item.href)}
						class="rounded-sm text-sm font-medium text-header-foreground/80 transition-colors hover:text-header-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		{:else}
			<div
				class="order-last w-full min-[68.75rem]:order-0 min-[68.75rem]:min-w-0 min-[68.75rem]:flex-1"
			>
				<div class="flex flex-col items-center">
					<SearchCard compact dark {initialLocation} onopen={() => (expanded = true)} />
				</div>
			</div>
		{/if}

		<SearchHeaderUserContent />
	</div>

	{#if !expanded}
		<div class="border-t bg-background px-4 py-3 text-foreground sm:px-6 min-[68.75rem]:hidden">
			<SearchToolbar />
		</div>
	{/if}

	{#if expanded}
		<div
			transition:slide={{ duration: 150 }}
			class="absolute inset-x-0 top-full border-b border-header-foreground/10 bg-header px-4 pt-4 pb-6 text-header-foreground shadow-lg sm:px-6 min-[68.75rem]:px-8"
		>
			<div class="mx-auto max-w-4xl">
				<SearchCard inlineSearch dark {initialLocation} onsearch={() => (expanded = false)} />
			</div>
		</div>
	{/if}
</header>
