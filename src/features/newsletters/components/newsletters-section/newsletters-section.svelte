<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { NEWSLETTER_SUBSCRIBE_CAPTCHA_ACTION } from '@/shared/features/captcha/config.js';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// SCHEMAS
	import { subscribeToNewsletterSchema } from '@/shared/features/newsletters/schemas/newsletterSchemas.js';

	// UTILS
	import { createNewsletterFields } from '@/features/newsletters/forms/createNewsletterForm.js';

	let submitting = $state(false);
	let subscribed = $state(false);
</script>

<Section
	id="newsletters"
	class="relative isolate scroll-mt-14 overflow-hidden bg-foreground [contain-intrinsic-size:auto_500px] [content-visibility:auto]"
	size="lg"
	containerClass="max-w-2xl"
>
	<!-- Decorative background elements -->
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
		<div class="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl"></div>
		<div
			class="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/20 to-transparent"
		></div>
	</div>

	<!-- Subtle grid pattern overlay -->
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.03]"
		style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)"
	></div>

	<div class="relative">
		<!-- Eyebrow label -->
		<div class="mb-6 flex items-center justify-center gap-2">
			<span class="h-px w-8 bg-primary/40"></span>
			<span class="text-xs font-medium tracking-[0.2em] text-primary/70 uppercase">
				{m['NewslettersFeature.NewslettersSection.eyebrow']()}
			</span>
			<span class="h-px w-8 bg-primary/40"></span>
		</div>

		<!-- Title -->
		<h2
			class="text-center font-serif text-3xl font-bold tracking-tight text-background sm:text-4xl lg:text-5xl"
		>
			{m['NewslettersFeature.NewslettersSection.title']()}
		</h2>

		<!-- Description -->
		<p
			class="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-background/60 lg:text-base"
		>
			{m['NewslettersFeature.NewslettersSection.description']()}
		</p>

		<!-- Form area -->
		<div class="mt-10">
			<Form
				class="w-full gap-3 sm:flex-row sm:items-start [&_[data-slot=field-label]]:sr-only [&_input]:h-12 [&_input]:rounded-lg [&_input]:border-background/10 [&_input]:bg-background/5 [&_input]:text-background [&_input]:backdrop-blur-sm [&_input]:transition-colors [&_input]:duration-200 [&_input]:placeholder:text-background/30 [&_input]:focus-visible:border-primary [&_input]:focus-visible:bg-background/10 [&_input]:focus-visible:ring-primary/20"
				function={api.tables.newsletters.mutations.subscribeToNewsletter.subscribeToNewsletter}
				functionType="action"
				captchaAction={NEWSLETTER_SUBSCRIBE_CAPTCHA_ACTION}
				fields={createNewsletterFields()}
				schema={subscribeToNewsletterSchema}
				bind:submitting
				onSuccess={() => {
					subscribed = true;
				}}
				successMessage={m['NewslettersFeature.NewslettersSection.subscribed']()}
				errorMessage={m['NewslettersFeature.NewslettersSection.subscribeError']()}
			>
				<Button
					type="submit"
					disabled={submitting}
					class="h-12 shrink-0 rounded-lg px-8 text-sm font-semibold shadow-lg shadow-primary/20 transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
				>
					{#if submitting}
						<span
							class="mr-2 icon-[lucide--loader-circle] inline-block h-4 w-4 animate-spin"
							aria-hidden="true"
						></span>
						{m['NewslettersFeature.NewslettersSection.subscribing']()}
					{:else}
						{m['NewslettersFeature.NewslettersSection.subscribe']()}
						<span
							class="ml-2 icon-[lucide--arrow-right] inline-block h-4 w-4 transition-transform duration-200"
							aria-hidden="true"
						></span>
					{/if}
				</Button>
			</Form>

			{#if subscribed}
				<div
					class="mt-3 flex items-center gap-3 rounded-lg border border-background/10 bg-background/5 px-4 py-3 text-sm font-medium text-success backdrop-blur-sm"
					role="status"
					aria-live="polite"
				>
					<span class="icon-[lucide--circle-check] size-5 shrink-0" aria-hidden="true"></span>
					{m['NewslettersFeature.NewslettersSection.subscribed']()}
				</div>
			{/if}
		</div>

		<!-- Disclaimer -->
		<p class="mt-5 text-center text-xs leading-relaxed text-background/40 sm:text-left">
			{m['NewslettersFeature.NewslettersSection.privacyHint']()}
		</p>

		<!-- Decorative bottom element -->
		<div class="mt-12 flex items-center justify-center gap-1.5">
			<span class="h-1 w-1 rounded-full bg-primary/30"></span>
			<span class="h-1 w-1 rounded-full bg-primary/50"></span>
			<span class="h-1 w-1 rounded-full bg-primary/30"></span>
		</div>
	</div>
</Section>
