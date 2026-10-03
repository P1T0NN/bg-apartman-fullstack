<script lang="ts">
	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// DATA
	import { HELP_TOPICS } from './helpTopics.js';

	// HOOKS
	import { useActiveSection } from '@/hooks/useActiveSection.svelte';
	import { usePathname } from '@/hooks/usePathname.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { Snippet } from 'svelte';

	type HelpSection = { id: string; label: string };

	let {
		title,
		description,
		metaDescription = description,
		sections = [],
		children
	}: {
		title: string;
		description: string;
		metaDescription?: string;
		sections?: HelpSection[];
		children: Snippet;
	} = $props();

	const pathname = usePathname();

	const active = useActiveSection(() => sections.map((section) => section.id));
</script>

<SvelteHead {title} description={metaDescription} />

<Section>
	<div
		class="grid gap-10 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_13rem] xl:gap-12"
	>
		<aside class="hidden lg:block">
			<nav class="sticky top-24" aria-labelledby="help-topics-title">
				<h2
					id="help-topics-title"
					class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
				>
					{m['HelpPage.HelpContent.helpCenter']()}
				</h2>

				<ul class="mt-3 flex flex-col gap-0.5">
					{#each HELP_TOPICS as topic (topic.href)}
						<li>
							<Link
								href={topic.href}
								aria-current={pathname.isActive(topic.href, true) ? 'page' : undefined}
								class={cn(
									'block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
									pathname.isActive(topic.href, true) && 'bg-muted font-medium text-foreground'
								)}
							>
								{m[topic.labelKey]()}
							</Link>
						</li>
					{/each}
				</ul>
			</nav>
		</aside>

		<article class="help-article max-w-3xl min-w-0">
			<header>
				<Link
					href={UNPROTECTED_PAGE_ENDPOINTS.HELP}
					class="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
				>
					<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>
					{m['HelpPage.HelpContent.helpCenter']()}
				</Link>

				<h1 class="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:mt-0">
					{title}
				</h1>

				<p class="mt-4 text-lg leading-8 text-muted-foreground">{description}</p>
			</header>

			{#if sections.length > 0}
				<details class="mt-6 rounded-xl border p-4 xl:hidden">
					<summary class="cursor-pointer text-sm font-medium">
						{m['HelpPage.HelpContent.onThisPage']()}
					</summary>

					<ul class="mt-3 flex flex-col gap-1.5 text-sm">
						{#each sections as section (section.id)}
							<li>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- same-page anchors -->
								<a
									href={`#${section.id}`}
									class="text-muted-foreground transition-colors hover:text-foreground"
								>
									{section.label}
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</li>
						{/each}
					</ul>
				</details>
			{/if}

			<div class="mt-10">
				{@render children()}
			</div>
		</article>

		{#if sections.length > 0}
			<aside class="hidden xl:block">
				<nav
					class="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
					aria-labelledby="on-this-page-title"
				>
					<h2
						id="on-this-page-title"
						class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
					>
						{m['HelpPage.HelpContent.onThisPage']()}
					</h2>

					<ul class="mt-3 flex flex-col border-s border-border">
						{#each sections as section (section.id)}
							<li>
								<!-- eslint-disable svelte/no-navigation-without-resolve -- same-page anchors -->
								<a
									href={`#${section.id}`}
									aria-current={active.activeId === section.id ? 'location' : undefined}
									class={cn(
										'-ms-px block border-s py-1.5 ps-3 text-sm transition-colors',
										active.activeId === section.id
											? 'border-primary font-medium text-foreground'
											: 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
									)}
								>
									{section.label}
								</a>
								<!-- eslint-enable svelte/no-navigation-without-resolve -->
							</li>
						{/each}
					</ul>
				</nav>
			</aside>
		{/if}
	</div>
</Section>

<style>
	.help-article :global(section) {
		margin-top: 3rem;
		scroll-margin-top: 6rem;
	}

	.help-article :global(section:first-child) {
		margin-top: 0;
	}
</style>
