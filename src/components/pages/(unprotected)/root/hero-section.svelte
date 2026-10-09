<script lang="ts">
	// COMPONENTS
	import SearchCard from '@/components/ui/custom-components/search-card/search-card.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<section class="relative isolate overflow-hidden bg-muted">
	<StaticImage
		src="/assets/belgrade-sunset.webp"
		alt={m['HomePage.HeroSection.imageAlt']()}
		loading="eager"
		fetchpriority="high"
		class="absolute inset-0 -z-20 size-full object-cover"
	/>

	<!-- Darkens the photo for legible type -->
	<div class="absolute inset-0 -z-10 bg-black/55" aria-hidden="true"></div>

	<Section as="div" size="none">
		<div
			class="flex min-h-[calc(100svh-4rem)] flex-col justify-center gap-10 py-16 sm:py-20 lg:py-24"
		>
			<div class="max-w-3xl">
				<h1
					class="text-5xl leading-[1.02] font-semibold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl"
				>
					{m['HomePage.HeroSection.title']()}
				</h1>

				<p class="mt-5 max-w-xl text-base text-pretty text-white/80 sm:text-lg">
					{m['HomePage.HeroSection.subtitle']()}
				</p>
			</div>

			<div class="w-full max-w-5xl">
				<SearchCard inlineSearch dark />
			</div>
		</div>
	</Section>
</section>
