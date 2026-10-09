<script lang="ts">
	// UTILS
	import { m } from '@/lib/paraglide/messages';
	import { cn } from '@/utils/utils.js';

	// Tab order must match the order of the sections on the page.
	const tabs = $derived([
		{ id: 'overview', label: m['AccommodationPage.AccommodationNavigation.overview']() },
		{ id: 'amenities', label: m['AccommodationPage.AccommodationNavigation.amenities']() },
		{ id: 'reviews', label: m['AccommodationPage.AccommodationNavigation.reviews']() },
		{ id: 'location', label: m['AccommodationPage.AccommodationNavigation.location']() },
		{ id: 'rules', label: m['AccommodationPage.AccommodationNavigation.rules']() },
		{
			id: 'cancellation-policy',
			label: m['AccommodationPage.AccommodationNavigation.cancellation']()
		}
	]);

	let navElement: HTMLElement | undefined = $state();
	let activeId = $state('overview');

	// Scroll-spy: highlight the tab of the section that is currently being read.
	// The top margin matches the space taken by the site header and this sticky bar.
	$effect(() => {
		const sections = tabs
			.map((tab) => document.getElementById(tab.id))
			.filter((element) => element !== null);
			
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const visible = new Set<string>();

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) visible.add(entry.target.id);
					else visible.delete(entry.target.id);
				}
				const current = tabs.find((tab) => visible.has(tab.id));
				if (current) activeId = current.id;
			},
			{ rootMargin: '-120px 0px -60% 0px' }
		);

		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	});

	// On small screens the bar scrolls sideways, so keep the active tab in view.
	$effect(() => {
		const tab = navElement?.querySelector<HTMLElement>(`[data-tab="${activeId}"]`);
		if (!navElement || !tab) return;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		navElement.scrollTo({
			left: tab.offsetLeft - (navElement.clientWidth - tab.offsetWidth) / 2,
			behavior: reduceMotion ? 'auto' : 'smooth'
		});
	});
</script>

<nav
	bind:this={navElement}
	aria-label={m['AccommodationPage.AccommodationNavigation.label']()}
	class="sticky top-16 z-20 -mx-4 mt-6 flex gap-6 overflow-x-auto border-b bg-background px-4 sm:-mx-6 sm:gap-8 sm:px-6"
>
	{#each tabs as tab (tab.id)}
		<a
			href={`#${tab.id}`}
			data-tab={tab.id}
			aria-current={activeId === tab.id ? 'location' : undefined}
			onclick={() => (activeId = tab.id)}
			class={cn(
				'shrink-0 border-b-2 border-transparent py-3.5 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2',
				activeId === tab.id && 'border-foreground text-foreground'
			)}
		>
			{tab.label}
		</a>
	{/each}
</nav>
