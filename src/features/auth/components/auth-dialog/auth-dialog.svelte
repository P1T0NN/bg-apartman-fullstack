<script lang="ts">
	// SVELTEKIT IMPORTS
	import { afterNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';

	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import SignInForm from '../sign-in-form/sign-in-form.svelte';
	import SignUpForm from '../sign-up-form/sign-up-form.svelte';

	// DATA
	import { AUTH_VIEW_PARAM } from '@/shared/features/auth/data/authData';

	type AuthView = 'sign-in' | 'sign-up';

	/** The dialog is already the surface, so the form drops its card chrome. */
	const formClass = 'w-full max-w-none bg-transparent shadow-none ring-0';

	let dialog: NativeDialog;
	/** null until the first open: the forms (and their captcha) mount lazily. */
	let view = $state<AuthView | null>(null);
	const uid = $props.id();

	/** Open on the requested form; callers use `bind:this` and `open('sign-up')`. */
	export function open(next: AuthView = 'sign-in') {
		view = next;
		dialog.open();
	}

	// The protected-layout redirect lands here with `?auth=...&redirectTo=...`.
	// Open the dialog, then drop only the view param — `redirectTo` must survive
	// until `useAuth` reads it as the sign-in callback.
	afterNavigate(() => {
		const requested = page.url.searchParams.get(AUTH_VIEW_PARAM);
		if (requested !== 'sign-in' && requested !== 'sign-up') return;

		open(requested);

		const cleaned = new URL(page.url);
		cleaned.searchParams.delete(AUTH_VIEW_PARAM);
		replaceState(cleaned, page.state);
	});
</script>

<NativeDialog bind:this={dialog} aria-labelledby={`${uid}-title`}>
	{#snippet children({ close })}
		<div class="relative">
			<h2 id={`${uid}-title`} class="sr-only">{m['AuthFeature.AuthDialog.title']()}</h2>
			<Button
				variant="ghost"
				size="icon-sm"
				class="absolute top-3 right-3"
				aria-label={m['AuthFeature.AuthDialog.close']()}
				onclick={close}
			>
				<span class="icon-[lucide--x]" aria-hidden="true"></span>
			</Button>

			{#if view === 'sign-in'}
				<SignInForm class={formClass} onSwitchToSignUp={() => (view = 'sign-up')} />
			{:else if view === 'sign-up'}
				<SignUpForm class={formClass} onSwitchToSignIn={() => (view = 'sign-in')} />
			{/if}
		</div>
	{/snippet}
</NativeDialog>
