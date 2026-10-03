<script lang="ts">
	// COMPONENTS
	import SearchCard from '@/components/ui/custom-components/search-card/search-card.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const trustPoints = [
		{ icon: 'icon-[lucide--badge-check]', label: m['HomePage.HeroSection.verifiedReviews']() },
		{ icon: 'icon-[lucide--user-check]', label: m['HomePage.HeroSection.noAccount']() },
		{ icon: 'icon-[lucide--calendar-check]', label: m['HomePage.HeroSection.cancellation']() }
	];
</script>

<section class="relative isolate overflow-hidden bg-muted">
	<StaticImage
		src="/assets/belgrade-sunset.webp"
		alt={m['HomePage.HeroSection.imageAlt']()}
		loading="eager"
		fetchpriority="high"
		class="absolute inset-0 -z-20 size-full object-cover"
	/>
	<div
		class="absolute inset-0 -z-10 bg-linear-to-b from-black/70 via-black/45 to-background"
		aria-hidden="true"
	></div>

	<Section as="div" size="none">
		<div class="flex flex-col items-center gap-10 py-14 text-center sm:py-20 lg:py-24">
			<div class="max-w-3xl">
				<p
					class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm"
				>
					<span class="icon-[lucide--map-pin] size-3.5" aria-hidden="true"></span>
					{m['HomePage.HeroSection.eyebrow']()}
				</p>

				<h1
					class="mt-6 text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl"
				>
					{m['HomePage.HeroSection.title']()}
				</h1>

				<p class="mx-auto mt-5 max-w-2xl text-base text-pretty text-white/85 sm:text-lg">
					{m['HomePage.HeroSection.description']()}
				</p>

				<ul
					class="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/90"
				>
					{#each trustPoints as point (point.label)}
						<li class="flex items-center gap-1.5">
							<span class={point.icon} aria-hidden="true"></span>
							{point.label}
						</li>
					{/each}
				</ul>
			</div>

			<div class="w-full max-w-5xl">
				<SearchCard />
			</div>
		</div>
	</Section>
</section>
