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
			options: [
				{ value: 'bug', label: m['FeedbacksFeature.type.bug']() },
				{ value: 'question', label: m['FeedbacksFeature.type.question']() }
			]
		},
		{
			kind: 'select',
			name: 'category',
			label: m['FeedbackPage.FeedbackForm.category'](),
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
			maxLength: 120,
			required: true
		},
		{
			kind: 'textarea',
			name: 'message',
			label: m['FeedbackPage.FeedbackForm.message'](),
			placeholder: m['FeedbackPage.FeedbackForm.messagePlaceholder'](),
			required: true
		},
		...(authenticated ? [] : [emailField])
	]);
</script>

<SvelteHead title={m['FeedbackPage.pageTitle']()} noindex />

<Section>
	<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
		<div class="flex flex-col gap-2 text-center">
			<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
				{m['FeedbackPage.title']()}
			</h1>
			<p class="text-balance text-muted-foreground">{m['FeedbackPage.description']()}</p>
		</div>

		{#if submitted}
			<Card.Root>
				<Card.Content class="flex flex-col items-center gap-4 py-10 text-center">
					<span
						class="flex size-12 items-center justify-center rounded-full bg-success/10 text-success"
					>
						<span class="icon-[lucide--circle-check] size-6" aria-hidden="true"></span>
					</span>
					<div class="flex flex-col gap-1">
						<h2 class="font-semibold">{m['FeedbackPage.successTitle']()}</h2>
						<p class="text-sm text-muted-foreground">{m['FeedbackPage.successDescription']()}</p>
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
					>
						<Button type="submit" disabled={submitting} class="w-full">
							{#if submitting}
								<Spinner />
							{/if}
							{m['FeedbackPage.FeedbackForm.submit']()}
						</Button>

						{#if authenticated && signedInEmail}
							<p class="text-center text-xs text-muted-foreground">
								{m['FeedbackPage.FeedbackForm.signedInHint']({ email: signedInEmail })}
							</p>
						{/if}
					</Form>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</Section>
