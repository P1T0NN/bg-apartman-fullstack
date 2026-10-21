<script lang="ts">
	// LIBRARIES
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants/pageEndpoints.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	type ContactLink = {
		href: string;
		icon: string;
		label: string;
		ariaLabel?: string;
		external?: boolean;
	};

	const year = new Date().getFullYear();
	const phoneHref = `tel:${COMPANY_DATA.PHONE.replaceAll(' ', '')}`;

	const columns = $derived([
		{
			heading: m['Components.Footer.bookStay'](),
			links: [
				{ href: UNPROTECTED_PAGE_ENDPOINTS.ROOT, label: m['Components.Footer.searchStays']() },
				{
					href: UNPROTECTED_PAGE_ENDPOINTS.FIND_BOOKING,
					label: m['Components.Footer.findBooking']()
				},
				{
					href: UNPROTECTED_PAGE_ENDPOINTS.HELP_CANCELLATION_POLICY,
					label: m['Components.Footer.cancellationPolicy']()
				}
			]
		},
		{
			heading: m['Components.Footer.support'](),
			links: [
				{ href: UNPROTECTED_PAGE_ENDPOINTS.HELP, label: m['Components.Footer.helpCenter']() },
				{ href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT, label: m['Components.Footer.contactUs']() },
				{ href: UNPROTECTED_PAGE_ENDPOINTS.FEEDBACK, label: m['Components.Footer.feedback']() }
			]
		},
		{
			heading: m['Components.Footer.hosting'](),
			links: [
				{
					href: UNPROTECTED_PAGE_ENDPOINTS.SIGN_UP,
					label: m['Components.Footer.listYourProperty']()
				},
				{
					href: UNPROTECTED_PAGE_ENDPOINTS.HELP_FOR_HOSTS,
					label: m['Components.Footer.hostHelp']()
				}
			]
		}
	]);

	const contacts = $derived<ContactLink[]>([
		{
			href: `mailto:${COMPANY_DATA.EMAIL}`,
			icon: 'icon-[lucide--mail]',
			label: COMPANY_DATA.EMAIL
		},
		{ href: phoneHref, icon: 'icon-[lucide--phone]', label: COMPANY_DATA.PHONE },
		{
			href: COMPANY_DATA.WHATSAPP_CONTACT_URL,
			icon: 'icon-[lucide--message-circle]',
			label: COMPANY_DATA.WHATSAPP_NUMBER,
			ariaLabel: m['Components.Footer.whatsapp'](),
			external: true
		},
		{
			href: COMPANY_DATA.INSTAGRAM_URL,
			icon: 'icon-[lucide--instagram]',
			label: m['Components.Footer.instagram'](),
			external: true
		}
	]);

	const columnHeadingClass =
		'text-xs font-semibold tracking-[0.18em] text-header-foreground/45 uppercase';
	const linkClass =
		'inline-block rounded-sm text-sm text-header-foreground/65 transition-colors hover:text-header-foreground focus-visible:ring-2 focus-visible:ring-header-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-header focus-visible:outline-none';
	const contactLinkClass = cn(linkClass, 'inline-flex max-w-full items-center gap-2.5');
</script>

<footer class="border-t border-header-foreground/10 bg-header text-header-foreground">
	<Section
		as="div"
		size="md"
		containerClass="grid gap-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10"
	>
		<div class="flex flex-col sm:col-span-2 lg:col-span-1">
			<Link
				href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
				class="inline-flex w-fit items-center gap-2 rounded-sm text-lg font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-header-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-header focus-visible:outline-none"
			>
				<Logo />
			</Link>

			<p class="mt-4 max-w-sm text-sm leading-6 text-header-foreground/60">
				{m['Components.Footer.tagline']()}
			</p>

			<ul class="mt-6 flex flex-col gap-3">
				{#each contacts as contact (contact.href)}
					<li>
						<!-- eslint-disable svelte/no-navigation-without-resolve -- mailto:, tel: and external channel links -->
						<a
							href={contact.href}
							target={contact.external ? '_blank' : undefined}
							rel={contact.external ? 'noopener noreferrer' : undefined}
							aria-label={contact.ariaLabel}
							class={contactLinkClass}
						>
							<span
								class={cn(contact.icon, 'size-4 shrink-0 text-header-foreground/40')}
								aria-hidden="true"
							></span>
							<span class="min-w-0 break-all">{contact.label}</span>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		</div>

		{#each columns as column (column.heading)}
			<nav aria-label={column.heading} class="flex flex-col gap-4">
				<h2 class={columnHeadingClass}>{column.heading}</h2>

				<ul class="flex flex-col gap-3">
					{#each column.links as link (link.href)}
						<li>
							<Link href={link.href} class={linkClass}>{link.label}</Link>
						</li>
					{/each}
				</ul>
			</nav>
		{/each}
	</Section>

	<div class="border-t border-header-foreground/10">
		<Section as="div" size="none" containerClass="py-6">
			<p class="text-xs text-header-foreground/45">
				{m['Components.Footer.copyright']({ year, name: COMPANY_DATA.NAME })}
			</p>
		</Section>
	</div>
</footer>
