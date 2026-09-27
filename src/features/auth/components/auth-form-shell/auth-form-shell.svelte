<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import * as Field from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import CaptchaField from '@/features/captcha/components/captcha-field.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import { ERROR_MESSAGE_KEYS } from '@/shared/features/auth/data/authData';

	// TYPES
	import type { ComponentProps, Snippet } from 'svelte';
	import type { CaptchaApi } from '@/features/captcha/hooks/useCaptcha.svelte';
	import type { SignUpErrorCode } from '@/shared/features/auth/types/authTypes';

	type Props = ComponentProps<typeof Card.Root> & {
		title: string;
		description: string;
		submitting: boolean;
		error: SignUpErrorCode | null;
		captcha: CaptchaApi;
		onsubmit: (event: SubmitEvent) => void | Promise<void>;
		submitLabel: string;
		/** Extra condition that keeps the submit button disabled (e.g. an incomplete OTP). */
		submitDisabled?: boolean;
		/** Removes the card surface on large screens for split auth pages. */
		splitLayout?: boolean;
		google?: { label: string; onclick: () => void | Promise<void> };
		/** Form-specific fields rendered above the captcha field. */
		children: Snippet;
		/** Rendered after the action buttons, inside the same field (e.g. a footer link). */
		actionsFooter?: Snippet;
		/** Rendered after the card content (e.g. one or more `Card.Footer` blocks). */
		footer?: Snippet;
	};

	let {
		title,
		description,
		submitting,
		error,
		captcha,
		onsubmit,
		submitLabel,
		submitDisabled = false,
		splitLayout = false,
		google,
		children,
		actionsFooter,
		footer,
		class: className,
		...restProps
	}: Props = $props();
</script>

<Card.Root
	class={cn(
		splitLayout &&
			'lg:gap-6 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:py-0 lg:shadow-none lg:ring-0',
		className
	)}
	{...restProps}
>
	<Card.Header
		class={cn(splitLayout && 'lg:items-center lg:justify-items-center lg:px-0 lg:text-center')}
	>
		<Card.Title class={cn(splitLayout && 'text-2xl font-bold')}>{title}</Card.Title>
		<Card.Description class={cn(splitLayout && 'lg:text-center')}>{description}</Card.Description>
	</Card.Header>

	<Card.Content class={cn(splitLayout && 'lg:px-0')}>
		<form {onsubmit}>
			<Field.Group>
				{@render children()}

				<Field.Field>
					<CaptchaField onToken={captcha.setToken} onReset={captcha.registerReset} />
				</Field.Field>

				{#if error}
					<p class="text-sm font-medium text-red-500">
						{#if error === 'PASSWORD_TOO_SHORT'}
							{m['AuthFeature.SignInForm.password']()}: {m['ValidationMessages.minLength']({
								minimum: 8
							})}
						{:else}
							{m[ERROR_MESSAGE_KEYS[error]]()}
						{/if}
					</p>
				{/if}

				<Field.Field>
					<Button type="submit" disabled={submitting || submitDisabled || !captcha.token}>
						{#if submitting}
							<Spinner />
						{/if}
						{submitLabel}
					</Button>
					{#if google}
						{#if splitLayout}
							<div class="hidden items-center gap-3 py-1 lg:flex" aria-hidden="true">
								<span class="h-px flex-1 bg-border"></span>
								<span class="h-px flex-1 bg-border"></span>
							</div>
						{/if}
						<Button
							variant="outline"
							type="button"
							disabled={submitting || !captcha.token}
							onclick={google.onclick}>{google.label}</Button
						>
					{/if}
					{@render actionsFooter?.()}
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>

	{@render footer?.()}
</Card.Root>
