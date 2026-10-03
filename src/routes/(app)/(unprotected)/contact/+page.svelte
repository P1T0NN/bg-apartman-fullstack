<script lang="ts">
	// COMPONENTS
	import ContactForm from '@/components/pages/(unprotected)/contact/contact-form.svelte';
	import ContactHeader from '@/components/pages/(unprotected)/contact/contact-header.svelte';
	import ContactInfo from '@/components/pages/(unprotected)/contact/contact-info.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<SvelteHead title={m['ContactPage.pageTitle']()} description={m['ContactPage.description']()} />

<Section>
	<ContactHeader />

	<div class="mt-12 grid items-start gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
		<ContactInfo />
		<ContactForm />
	</div>
</Section>
