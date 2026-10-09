<script lang="ts">
	// LIBRARIES
	import { api } from '@convex/_generated/api';
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import TicketCard from '@/components/ui/custom-components/ticket-card/ticket-card.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';

	// SCHEMAS
	import { requestBookingRecoveryLinkSchema } from '@/shared/features/bookingsRecoveryTokens/schemas/bookingRecoveryTokenSchemas.js';

	// TYPES
	import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

	let submitting = $state(false);
	let requestAcknowledged = $state(false);

	const fields = $derived<FieldConfig[]>([
		{
			kind: 'input',
			name: 'email',
			type: 'email',
			label: m['FindBookingPage.FindBookingForm.email'](),
			description: m['FindBookingPage.FindBookingForm.emailHint'](),
			placeholder: m['FindBookingPage.FindBookingForm.emailPlaceholder'](),
			autocomplete: 'email',
			inputmode: 'email',
			maxLength: 254,
			required: true
		}
	]);

	// The flow the person is walking through. Order matters, so it is numbered.
	const steps = $derived([
		m['FindBookingPage.FindBookingForm.stepEmail'](),
		m['FindBookingPage.FindBookingForm.stepLink'](),
		m['FindBookingPage.FindBookingForm.stepBooking']()
	]);

	// Step 1 is active until the request goes through, then step 2 (check your inbox).
	const currentStep = $derived(requestAcknowledged ? 1 : 0);

	// Motion only answers the submit action, and is skipped for reduced-motion users.
	const revealDuration = $derived(prefersReducedMotion.current ? 0 : 300);
</script>

<TicketCard
	class={requestAcknowledged ? 'border-success/40' : ''}
	bodyClass="[&_input]:h-12 [&_input]:rounded-xl [&_input]:px-4 [&_input]:text-base md:[&_input]:text-base"
>
	{#snippet body()}
		<Form
			function={api.tables.bookingRecoveryTokens.actions.requestBookingRecoveryLink
				.requestBookingRecoveryLink}
			functionType="action"
			schema={requestBookingRecoveryLinkSchema}
			{fields}
			extraFields={{ locale: getLocale() }}
			bind:submitting
			resetOnSuccess={false}
			successMessage={m['FindBookingPage.requestAcknowledged']()}
			onSuccess={() => {
				requestAcknowledged = true;
			}}
			oninput={() => {
				requestAcknowledged = false;
			}}
		>
			<Button
				type="submit"
				disabled={submitting}
				class="h-12 w-full rounded-xl text-base font-semibold"
			>
				{#if submitting}
					<Spinner data-icon="inline-start" aria-hidden="true" />
				{/if}

				{submitting
					? m['FindBookingPage.FindBookingForm.submitting']()
					: m['FindBookingPage.FindBookingForm.submit']()}
			</Button>
		</Form>

		<div role="status">
			{#if requestAcknowledged}
				<div
					in:fly={{ y: 6, duration: revealDuration }}
					class="mt-6 flex gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm leading-6"
				>
					<span
						class="mt-0.5 icon-[lucide--circle-check] size-5 shrink-0 text-success"
						aria-hidden="true"
					></span>

					<div class="flex min-w-0 flex-col gap-1">
						<p class="font-semibold text-success">
							{m['FindBookingPage.FindBookingForm.checkInbox']()}
						</p>
						<p class="text-success">{m['FindBookingPage.requestAcknowledged']()}</p>
						<p class="mt-1 text-muted-foreground">
							{m['FindBookingPage.FindBookingForm.inboxHint']()}
						</p>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet stub()}
		<ol class="flex flex-col">
			{#each steps as label, i (i)}
				{@const done = i < currentStep}
				{@const current = i === currentStep}
				<li class="relative flex gap-3 pb-6 last:pb-0" aria-current={current ? 'step' : undefined}>
					{#if i < steps.length - 1}
						<span
							aria-hidden="true"
							class="absolute top-8 bottom-1 left-3.5 border-l border-dashed transition-colors duration-500 {done
								? 'border-success/50'
								: 'border-border'}"
						></span>
					{/if}

					<span
						class="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums transition-colors duration-300 {done
							? 'border-success/30 bg-success/15 text-success'
							: current
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-background text-muted-foreground'}"
					>
						{#if done}
							<span class="icon-[lucide--check] size-3.5" aria-hidden="true"></span>
						{:else}
							{i + 1}
						{/if}
					</span>

					<p
						class="pt-1 text-sm leading-5 transition-colors duration-300 {current
							? 'font-medium text-foreground'
							: 'text-muted-foreground'}"
					>
						{label}
					</p>
				</li>
			{/each}
		</ol>
	{/snippet}
</TicketCard>
