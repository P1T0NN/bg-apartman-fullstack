<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';

	// DATA
	import { testimonialsData } from '@/shared/data/testimonialsData';

	// LUCIDE ICONS
	// The filled star rating and play glyph import Lucide directly because they use
	// `fill-*`; iconify/tailwind icons render via a CSS mask that cannot be filled.
	import StarIcon from '@lucide/svelte/icons/star';
	import PlayIcon from '@lucide/svelte/icons/play';
</script>

<Section
	id="testimonials"
	class="scroll-mt-14 overflow-hidden [contain-intrinsic-size:auto_900px] [content-visibility:auto]"
	size="lg"
	containerClass="flex flex-col gap-10 lg:gap-16"
>
	<!-- Section Header - left-aligned with trust badges on the right -->
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
				{m['HomePage.TestimonialsSection.eyebrow']()}
			</p>
			<h2
				class="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
			>
				{m['HomePage.TestimonialsSection.lovedByGuests']()}
				<br class="hidden lg:block" />
				<span class="text-primary">{m['HomePage.TestimonialsSection.aroundTheWorld']()}</span>
			</h2>
		</div>

		<!-- Trust Badges - compact, inline -->
		<div class="flex flex-wrap gap-4 lg:gap-5 lg:pb-1">
			<div class="flex items-center gap-2">
				<span class="icon-[lucide--badge-check] h-5 w-5 text-primary" aria-hidden="true"></span>
				<span class="text-sm font-medium text-muted-foreground">
					{m['HomePage.TestimonialsSection.verifiedReviews']()}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="icon-[lucide--shield-check] h-5 w-5 text-primary" aria-hidden="true"></span>
				<span class="text-sm font-medium text-muted-foreground">
					{m['HomePage.TestimonialsSection.secureBooking']()}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<span
					class="icon-[lucide--circle-dollar-sign] h-5 w-5 text-primary"
					aria-hidden="true"
				></span>
				<span class="text-sm font-medium text-muted-foreground">
					{m['HomePage.TestimonialsSection.bestPrice']()}
				</span>
			</div>
		</div>
	</div>

	<!-- Bento Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
		{#each testimonialsData as testimonial, i (testimonial.id)}
			{@const authorLink = testimonial.profileUrl ?? testimonial.reelUrl ?? testimonial.postUrl}
			<!-- Card 0: featured (span 2), Card 3: featured (span 2), rest: regular -->
			{@const isFeatured = i === 0 || i === 3}
			<div
				class="group relative rounded-2xl p-6 transition-shadow duration-300 lg:p-8
					{isFeatured ? 'sm:col-span-2' : ''}
					{i === 0
					? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
					: 'border border-border/50 bg-card shadow-sm hover:shadow-md'}"
			>
				<!-- Decorative quote icon -->
				<span
					class="absolute top-5 right-5 icon-[lucide--quote] h-10 w-10 lg:h-12 lg:w-12
						{i === 0 ? 'text-primary-foreground/10' : 'text-muted-foreground/10'}"
					aria-hidden="true"
				></span>

				<!-- Author (top) -->
				<div class="mb-4 flex items-center gap-3">
					{#if authorLink}
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={authorLink}
							target="_blank"
							rel="noopener noreferrer"
							class="group/author flex items-center gap-3"
						>
							<StaticImage
								src={testimonial.avatar96}
								srcset="{testimonial.avatar96} 96w"
								sizes="70px"
								alt={testimonial.name}
								class="h-10 w-10 rounded-full object-cover ring-2 transition-opacity group-hover/author:opacity-80
									{i === 0 ? 'ring-primary-foreground/20' : 'ring-border'}"
								width={70}
								height={70}
							/>
							<div class="flex items-center gap-1.5">
								<span
									class="text-sm font-semibold group-hover/author:underline {i === 0
										? 'text-primary-foreground'
										: 'text-card-foreground'}"
								>
									{testimonial.name}
								</span>
								<span
									class="icon-[lucide--external-link] h-3 w-3 {i === 0
										? 'text-primary-foreground/50'
										: 'text-muted-foreground'}"
									aria-hidden="true"
								></span>
							</div>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					{:else}
						<StaticImage
							src={testimonial.avatar96}
							srcset="{testimonial.avatar96} 96w"
							sizes="70px"
							alt={testimonial.name}
							class="h-10 w-10 rounded-full object-cover ring-2
								{i === 0 ? 'ring-primary-foreground/20' : 'ring-border'}"
							width={70}
							height={70}
						/>
						<span
							class="text-sm font-semibold {i === 0
								? 'text-primary-foreground'
								: 'text-card-foreground'}"
						>
							{testimonial.name}
						</span>
					{/if}
					<span
						class="ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
							{i === 0
							? 'bg-primary-foreground/15 text-primary-foreground'
							: 'bg-secondary text-secondary-foreground'}"
					>
						{testimonial.destination}
					</span>
				</div>

				<!-- Rating -->
				<div class="mb-3 flex gap-0.5">
					{#each Array.from({ length: testimonial.rating }, (_, k) => k) as starIndex (starIndex)}
						<StarIcon
							class="h-4 w-4
								{i === 0 ? 'fill-primary-foreground/80 text-primary-foreground/80' : 'fill-warning text-warning'}"
							aria-hidden="true"
						/>
					{/each}
				</div>

				<!-- Text -->
				<p
					class="leading-relaxed
						{isFeatured ? 'text-base lg:text-lg' : 'text-sm lg:text-base'}
						{i === 0 ? 'text-primary-foreground/90' : 'text-muted-foreground'}
						{testimonial.thumbnail && testimonial.reelUrl ? 'mb-5' : ''}"
				>
					"{testimonial.text}"
				</p>

				<!-- Media preview (reel thumbnail only) -->
				{#if testimonial.thumbnail && testimonial.reelUrl}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={testimonial.reelUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="group/media relative mt-auto block aspect-video overflow-hidden rounded-xl"
					>
						<StaticImage
							src={testimonial.thumbnail480 ?? testimonial.thumbnail}
							srcset={testimonial.thumbnail480 ? `${testimonial.thumbnail480} 480w` : undefined}
							sizes="(max-width: 640px) 100vw, 33vw"
							alt={m['HomePage.TestimonialsSection.watchReviewAlt']({
								name: testimonial.name
							})}
							class="h-full w-full object-cover transition-transform duration-500 group-hover/media:scale-105"
							width={480}
							height={270}
						/>
						<div
							class="absolute inset-0 bg-black/30 transition-colors duration-300 group-hover/media:bg-black/40"
						></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<div
								class="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover/media:scale-110"
							>
								<PlayIcon
									class="ml-0.5 h-5 w-5 fill-foreground text-foreground"
									aria-hidden="true"
								/>
							</div>
						</div>
						<span class="absolute bottom-2.5 left-3 text-xs font-medium text-white/90">
							{m['HomePage.TestimonialsSection.watchReview']()}
						</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			</div>
		{/each}
	</div>
</Section>
