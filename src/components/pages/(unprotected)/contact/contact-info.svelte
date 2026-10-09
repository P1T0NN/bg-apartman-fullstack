<script lang="ts">
	// COMPONENTS
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';

	const phoneHref = `tel:${COMPANY_DATA.PHONE.replaceAll(' ', '')}`;
</script>

{#snippet channel(
	href: string,
	icon: string,
	label: string,
	options?: { external?: boolean; ariaLabel?: string }
)}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- mailto:, tel: and external channel links -->
	<a
		{href}
		target={options?.external ? '_blank' : undefined}
		rel={options?.external ? 'noopener noreferrer' : undefined}
		aria-label={options?.ariaLabel}
		class="group flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
	>
		<span
			class="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground"
		>
			<span class={icon} aria-hidden="true"></span>
		</span>
		<span class="min-w-0 text-sm font-medium break-all">{label}</span>
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h2 class="text-xl font-semibold tracking-tight">{m['ContactPage.ContactInfo.title']()}</h2>
		<p class="text-sm text-muted-foreground">{m['ContactPage.ContactInfo.description']()}</p>
	</div>

	<div class="flex flex-col gap-3">
		{@render channel(`mailto:${COMPANY_DATA.EMAIL}`, 'icon-[lucide--mail]', COMPANY_DATA.EMAIL)}
		{@render channel(phoneHref, 'icon-[lucide--phone]', COMPANY_DATA.PHONE)}
		{@render channel(
			COMPANY_DATA.WHATSAPP_CONTACT_URL,
			'icon-[lucide--message-circle]',
			COMPANY_DATA.WHATSAPP_NUMBER,
			{ external: true, ariaLabel: m['ContactPage.ContactInfo.whatsapp']() }
		)}
	</div>

	<Logo showText={false} class="mt-2" imageClass="h-auto w-40 sm:w-48" />
</div>
