<script lang="ts">
	// CONVEX
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { createFeedbackSchema } from '@/shared/features/feedbacks/schemas/feedbackSchemas.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	// TYPES
	import type { PageProps } from './$types';
	import type {
		MutationValues,
		FieldConfig,
		InputField
	} from '@/components/ui/custom-components/form/formTypes.js';

	let { data }: PageProps = $props();

	const createFeedback = api.tables.feedbacks.mutations.createFeedback.createFeedback;
	const authenticated = $derived(data.authState.isAuthenticated);
	const signedInEmail = $derived(data.currentUser?.email ?? '');

	let submitted = $state(false);
	let submitting = $state(false);
	let values = $state<MutationValues<typeof createFeedback>>({
		type: 'question',
		category: 'other',
		title: '',
		message: '',
		email: ''
	});

	const emailField = {
		kind: 'input',
		name: 'email',
		type: 'email',
		label: m['FeedbackPage.FeedbackForm.email'](),
		placeholder: m['FeedbackPage.FeedbackForm.emailPlaceholder'](),
		description: m['FeedbackPage.FeedbackForm.emailHint'](),
		maxLength: 320
	} satisfies InputField;

	const fields = $derived.by((): FieldConfig[] => [
		{
			kind: 'select',
			name: 'type',
			label: m['FeedbackPage.FeedbackForm.type'](),
			class: 'sm:col-span-2',
			options: [
				{ value: 'bug', label: m['FeedbacksFeature.type.bug']() },
				{ value: 'question', label: m['FeedbacksFeature.type.question']() }
			]
		},
		{
			kind: 'select',
			name: 'category',
			label: m['FeedbackPage.FeedbackForm.category'](),
			class: 'sm:col-span-2',
			options: [
				{ value: 'booking', label: m['FeedbacksFeature.category.booking']() },
				{ value: 'payment', label: m['FeedbacksFeature.category.payment']() },
				{ value: 'account', label: m['FeedbacksFeature.category.account']() },
				{ value: 'accommodation', label: m['FeedbacksFeature.category.accommodation']() },
				{ value: 'other', label: m['FeedbacksFeature.category.other']() }
			]
		},
		{
			kind: 'input',
			name: 'title',
			label: m['FeedbackPage.FeedbackForm.title'](),
			placeholder: m['FeedbackPage.FeedbackForm.titlePlaceholder'](),
			class: 'sm:col-span-2',
			maxLength: 120,
			required: true
		},
		{
			kind: 'textarea',
			name: 'message',
			label: m['FeedbackPage.FeedbackForm.message'](),
			placeholder: m['FeedbackPage.FeedbackForm.messagePlaceholder'](),
			class: 'sm:col-span-2',
			required: true
		},
		...(authenticated ? [] : [{ ...emailField, class: 'sm:col-span-2' }])
	]);
</script>

<SvelteHead title={m['FeedbackPage.pageTitle']()} noindex />

<Section size="none" class="min-h-screen pt-24 pb-16 sm:pt-32">
	<div class="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
		<header class="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24">
			<h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
				{m['FeedbackPage.title']()}
			</h1>

			<p class="max-w-prose text-lg leading-8 text-muted-foreground">
				{m['FeedbackPage.description']()}
			</p>

			{#if authenticated && signedInEmail}
				<p
					class="flex max-w-prose items-start gap-2 text-sm leading-6 break-words text-muted-foreground"
				>
					<span
						class="mt-0.5 icon-[lucide--mail] size-4 shrink-0 text-primary"
						aria-hidden="true"
					></span>
					{m['FeedbackPage.FeedbackForm.signedInHint']({ email: signedInEmail })}
				</p>
			{/if}
		</header>

		<div class="min-w-0">
			{#if submitted}
				<Card.Root>
					<Card.Content class="flex flex-col items-start gap-5 py-10 sm:py-12" role="status">
						<span
							class="flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success"
						>
							<span class="icon-[lucide--circle-check] size-7" aria-hidden="true"></span>
						</span>

						<div class="flex flex-col gap-1">
							<h2 class="text-xl font-semibold">{m['FeedbackPage.successTitle']()}</h2>
							<p class="text-sm leading-6 text-muted-foreground">
								{m['FeedbackPage.successDescription']()}
							</p>
						</div>

						<Button variant="outline" onclick={() => (submitted = false)}>
							{m['FeedbackPage.sendAnother']()}
						</Button>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Content>
						<Form
							function={createFeedback}
							schema={createFeedbackSchema}
							{fields}
							bind:values
							bind:submitting
							onSuccess={() => {
								submitted = true;
							}}
							errorMessage={m['FeedbackPage.error']()}
							class="grid gap-5 sm:grid-cols-2"
						>
							<Button
								type="submit"
								size="lg"
								disabled={submitting}
								class="w-full sm:col-span-2 sm:w-auto sm:justify-self-end"
							>
								{#if submitting}
									<Spinner />
								{/if}
								{m['FeedbackPage.FeedbackForm.submit']()}
								<span class="icon-[lucide--send] size-4" aria-hidden="true"></span>
							</Button>
						</Form>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
</Section>
