<script lang="ts">
	// COMPONENTS
	import HelpContent from '@/components/pages/(unprotected)/help/help-content.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';

	// DATA
	import { HELP_TOPICS } from '@/components/pages/(unprotected)/help/helpTopics.js';

	// UTILS
	import { m } from '@/lib/paraglide/messages';
</script>

<HelpContent
	title={m['HelpIndexPage.pageTitle']()}
	description={m['HelpIndexPage.lead']()}
	metaDescription={m['HelpIndexPage.metaDescription']()}
>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each HELP_TOPICS as topic (topic.href)}
			<li>
				<Link
					href={topic.href}
					class="group flex h-full items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
				>
					<span
						class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
					>
						<span class="{topic.icon} size-5" aria-hidden="true"></span>
					</span>

					<span class="flex min-w-0 flex-1 flex-col gap-1">
						<span class="flex items-center justify-between gap-2 text-sm font-medium">
							{m[topic.labelKey]()}
							<span
								class="icon-[lucide--arrow-right] size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
								aria-hidden="true"
							></span>
						</span>
						<span class="text-sm leading-6 text-muted-foreground">
							{m[topic.descriptionKey]()}
						</span>
					</span>
				</Link>
			</li>
		{/each}
	</ul>
</HelpContent>
