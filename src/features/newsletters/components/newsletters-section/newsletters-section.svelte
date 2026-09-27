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
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { subscribeToNewsletterSchema } from '@/shared/features/newsletters/schemas/newsletterSchemas.js';

	// UTILS
	import { createNewsletterFields } from '@/features/newsletters/forms/createNewsletterForm.js';

	let submitting = $state(false);
	let subscribed = $state(false);
</script>

<Section class="bg-muted/50">
	<div class="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
		<div class="flex flex-col gap-2">
			<h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
				{m['NewslettersFeature.NewslettersSection.title']()}
			</h2>
			<p class="text-balance text-muted-foreground">
				{m['NewslettersFeature.NewslettersSection.description']()}
			</p>
		</div>

		<Form
			class="w-full max-w-md"
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
			<Button type="submit" disabled={submitting} class="w-full">
				{#if submitting}
					<Spinner />
				{/if}
				{m['NewslettersFeature.NewslettersSection.subscribe']()}
			</Button>

			{#if subscribed}
				<div
					class="flex items-center justify-center gap-3 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success"
					role="status"
					aria-live="polite"
				>
					<span class="icon-[lucide--circle-check] size-5 shrink-0" aria-hidden="true"></span>
					{m['NewslettersFeature.NewslettersSection.subscribed']()}
				</div>
			{/if}
		</Form>

		<p class="text-xs text-muted-foreground">
			{m['NewslettersFeature.NewslettersSection.privacyHint']()}
		</p>
	</div>
</Section>
