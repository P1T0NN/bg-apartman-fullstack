<script lang="ts">
	// TYPES
	import type { Snippet } from 'svelte';

	let {
		body,
		stub,
		class: className = '',
		bodyClass = '',
		stubClass = ''
	}: {
		body: Snippet;
		stub: Snippet;
		class?: string;
		bodyClass?: string;
		stubClass?: string;
	} = $props();
</script>

<!--
	Ticket card: a body and a tear-off stub separated by a dashed tear line.
	- mobile: body on top, stub below, horizontal tear line
	- md+:    body on the left, stub on the right, vertical tear line

	Notches: each one is a half-size box with overflow-hidden holding a full circle,
	so only the half that sits inside the card is visible. Built with standard utilities only.
-->
<div
	class="relative flex flex-col rounded-2xl border bg-card text-card-foreground shadow-sm transition-colors duration-500 md:flex-row {className}"
>
	<div class="min-w-0 flex-1 p-6 sm:p-8 {bodyClass}">
		{@render body()}
	</div>

	<div
		class="relative rounded-b-2xl border-t border-dashed bg-muted/40 p-6 sm:p-8 md:w-72 md:shrink-0 md:rounded-r-2xl md:rounded-bl-none md:border-t-0 md:border-l lg:w-80 {stubClass}"
	>
		<!-- Notch at the start of the tear line (left on mobile, top on md+) -->
		<span
			aria-hidden="true"
			class="pointer-events-none absolute -top-3 -left-px h-6 w-3 overflow-hidden md:-top-px md:-left-3 md:h-3 md:w-6"
		>
			<span
				class="block size-6 -translate-x-1/2 rounded-full border bg-background md:translate-x-0 md:-translate-y-1/2"
			></span>
		</span>

		<!-- Notch at the end of the tear line (right on mobile, bottom on md+) -->
		<span
			aria-hidden="true"
			class="pointer-events-none absolute -top-3 -right-px h-6 w-3 overflow-hidden md:top-auto md:right-auto md:-bottom-px md:-left-3 md:h-3 md:w-6"
		>
			<span class="block size-6 rounded-full border bg-background"></span>
		</span>

		{@render stub()}
	</div>
</div>
