<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { sendContactFormSchema } from '@/shared/features/contact/schemas/contactSchemas.js';

	// TYPES
	import type {
		FieldConfig,
		MutationValues
	} from '@/components/ui/custom-components/form/formTypes.js';

	const sendContactForm = api.contact.mutations.sendContactForm.sendContactForm;

	let submitted = $state(false);
	let submitting = $state(false);
	let values = $state<MutationValues<typeof sendContactForm>>({
		name: '',
		company: '',
		email: '',
		message: ''
	});

	const fields: FieldConfig[] = [
		{
			kind: 'input',
			name: 'name',
			label: m['ContactPage.ContactForm.name'](),
			placeholder: m['ContactPage.ContactForm.namePlaceholder'](),
			autocomplete: 'name',
			maxLength: 120,
			required: true
		},
		{
			kind: 'input',
			name: 'company',
			label: m['ContactPage.ContactForm.company'](),
			placeholder: m['ContactPage.ContactForm.companyPlaceholder'](),
			autocomplete: 'organization',
			maxLength: 120
		},
		{
			kind: 'input',
			name: 'email',
			type: 'email',
			label: m['ContactPage.ContactForm.email'](),
			placeholder: m['ContactPage.ContactForm.emailPlaceholder'](),
			autocomplete: 'email',
			maxLength: 320,
			required: true
		},
		{
			kind: 'textarea',
			name: 'message',
			label: m['ContactPage.ContactForm.message'](),
			placeholder: m['ContactPage.ContactForm.messagePlaceholder'](),
			rows: 5,
			required: true
		}
	];
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m['ContactPage.ContactForm.title']()}</Card.Title>
		<Card.Description>{m['ContactPage.ContactForm.description']()}</Card.Description>
	</Card.Header>

	<Card.Content class="flex flex-col gap-6">
		<div class="border-t border-dashed border-border" aria-hidden="true"></div>

		{#if submitted}
			<div class="flex flex-col items-center gap-4 py-2 text-center" role="status">
				<span
					class="flex size-12 items-center justify-center rounded-full bg-success/10 text-success"
				>
					<span class="icon-[lucide--circle-check] size-6" aria-hidden="true"></span>
				</span>

				<div class="flex flex-col gap-1">
					<h2 class="font-semibold">{m['ContactPage.ContactForm.successTitle']()}</h2>
					<p class="text-sm text-muted-foreground">
						{m['ContactPage.ContactForm.successDescription']()}
					</p>
				</div>

				<Button variant="outline" onclick={() => (submitted = false)}>
					{m['ContactPage.ContactForm.sendAnother']()}
				</Button>
			</div>
		{:else}
			<Form
				function={sendContactForm}
				functionType="action"
				schema={sendContactFormSchema}
				{fields}
				bind:values
				bind:submitting
				onSuccess={() => {
					submitted = true;
				}}
				successMessage={m['ContactPage.ContactForm.successTitle']()}
				errorMessage={m['ContactPage.ContactForm.error']()}
			>
				<Button type="submit" size="lg" disabled={submitting} class="w-full sm:w-auto">
					{#if submitting}
						<Spinner />
					{/if}
					{m['ContactPage.ContactForm.submit']()}
					<span class="icon-[lucide--arrow-right] size-4" aria-hidden="true"></span>
				</Button>
			</Form>
		{/if}
	</Card.Content>
</Card.Root>
