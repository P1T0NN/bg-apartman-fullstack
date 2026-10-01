<script lang="ts">
	// LIBRARIES
	import { useAuth } from '../../hooks/useAuth.svelte';
	import { useCaptcha } from '@/features/captcha/hooks/useCaptcha.svelte';
	import { m } from '@/lib/paraglide/messages';

	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import AuthFormShell from '../auth-form-shell/auth-form-shell.svelte';
	import EmailInput from '@/components/ui/custom-components/email-input/email-input.svelte';
	import PasswordInput from '@/components/ui/custom-components/password-input/password-input.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ComponentProps } from 'svelte';

	type SignInFormProps = ComponentProps<typeof Card.Root> & {
		/** When set, switching to sign-up happens in place (dialog) instead of navigating. */
		onSwitchToSignUp?: () => void;
		/** Opt-in for the split auth pages; the dialog keeps the normal card spacing. */
		splitLayout?: boolean;
	};

	let {
		onSwitchToSignUp,
		splitLayout = false,
		class: className,
		...restProps
	}: SignInFormProps = $props();

	const auth = useAuth();
	const captcha = useCaptcha();

	let email = $state('');
	let password = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!captcha.token) return;
		try {
			await auth.signInWithEmail(email, password, captcha.token);
		} finally {
			captcha.reset();
		}
	}

	async function handleGoogleSignIn() {
		if (!captcha.token) return;
		try {
			await auth.signInWithGoogle(captcha.token);
		} finally {
			captcha.reset();
		}
	}
</script>

<AuthFormShell
	class={cn('w-full max-w-sm', className)}
	{...restProps}
	title={m['AuthFeature.SignInForm.welcomeBack']()}
	description={m['AuthFeature.SignInForm.loginDescription']()}
	{splitLayout}
	submitting={auth.submitting}
	error={auth.error}
	{captcha}
	onsubmit={handleSubmit}
	submitLabel={m['AuthFeature.SignInForm.signIn']()}
	google={{
		label: m['AuthFeature.SignInForm.continueWithGoogle'](),
		onclick: handleGoogleSignIn
	}}
>
	<Field.Field>
		<Field.Label for="email">{m['AuthFeature.SignInForm.email']()}</Field.Label>
		<EmailInput id="email" required bind:value={email} />
	</Field.Field>

	<Field.Field>
		<Field.Label for="password">{m['AuthFeature.SignInForm.password']()}</Field.Label>
		<PasswordInput id="password" required bind:value={password} />

		<Field.Description class="flex items-center justify-between">
			<span>{m['AuthFeature.SignInForm.rememberSession']()}</span>
			<a href={UNPROTECTED_PAGE_ENDPOINTS.FORGOT_PASSWORD}>
				{m['AuthFeature.SignInForm.forgotYourPassword']()}
			</a>
		</Field.Description>
	</Field.Field>
	{#snippet actionsFooter()}
		<Field.Description class="px-6 text-center">
			{m['AuthFeature.SignInForm.noAccount']()}
			{#if onSwitchToSignUp}
				<button
					type="button"
					class="cursor-pointer underline underline-offset-4 hover:text-primary"
					onclick={onSwitchToSignUp}
				>
					{m['AuthFeature.SignInForm.signUp']()}
				</button>
			{:else}
				<a href={UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP}>{m['AuthFeature.SignInForm.signUp']()}</a>
			{/if}
		</Field.Description>
	{/snippet}
</AuthFormShell>
