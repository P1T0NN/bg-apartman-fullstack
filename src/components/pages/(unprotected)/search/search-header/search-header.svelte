<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// LIBRARIES
	import { slide } from 'svelte/transition';

	// CONSTANTS
	import { COMPANY_DATA } from '@/shared/config';

	// COMPONENTS
	import SearchCard from '@/components/ui/custom-components/search-card/search-card.svelte';
	import SearchToolbar from '@/components/pages/(unprotected)/search/search-filters/search-toolbar.svelte';
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
	class="sticky top-0 z-40 border-b bg-background"
>
	<div
		class="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 min-[68.75rem]:items-start min-[68.75rem]:px-8"
	>
		<a href={resolve('/')} class="text-lg font-semibold tracking-tight min-[68.75rem]:pt-1">
			{COMPANY_DATA.NAME}
		</a>

		{#if expanded}
			<nav class="flex items-center gap-5 min-[68.75rem]:pt-2">
				{#each navItems as item (item.href)}
					<a
						href={resolve(item.href)}
						class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
					<SearchCard compact {initialLocation} onopen={() => (expanded = true)} />
					<SearchToolbar />
				</div>
			</div>
		{/if}

		<SearchHeaderUserContent />
	</div>

	{#if expanded}
		<div
			transition:slide={{ duration: 150 }}
			class="absolute inset-x-0 top-full border-b bg-background px-4 pt-4 pb-6 shadow-lg sm:px-6 min-[68.75rem]:px-8"
		>
			<div class="mx-auto max-w-4xl">
				<SearchCard inlineSearch {initialLocation} onsearch={() => (expanded = false)} />
			</div>
		</div>
	{/if}
</header>
