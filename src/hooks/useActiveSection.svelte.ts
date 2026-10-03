// SVELTE IMPORTS
import { onMount } from 'svelte';

/** Tracks which of the given section IDs is currently active while scrolling. */
export function useActiveSection(getIds: () => string[], activationOffset = 96) {
	let activeId = $state('');

	onMount(() => {
		const ids = getIds();
		if (ids.length === 0) return;

		let frame = 0;

		function update() {
			frame = 0;

			const headings = ids
				.map((id) => ({ id, element: document.getElementById(id) }))
				.filter((entry): entry is { id: string; element: HTMLElement } => entry.element !== null);
			if (headings.length === 0) return;

			const viewportHeight = window.innerHeight;
			const maxScroll = document.documentElement.scrollHeight - viewportHeight;
			if (maxScroll <= 0) {
				activeId = headings[0].id;
				return;
			}

			// Close to the bottom the page cannot scroll further, so the activation
			// line slides down to the viewport edge and every remaining section activates in order.
			const remainingScroll = Math.max(0, maxScroll - window.scrollY);
			const line =
				remainingScroll < viewportHeight - activationOffset
					? viewportHeight - remainingScroll
					: activationOffset;

			let nextActive = headings[0].id;
			for (const { id, element } of headings) {
				if (element.getBoundingClientRect().top <= line) nextActive = id;
				else break;
			}
			activeId = nextActive;
		}

		function schedule() {
			if (frame === 0) frame = requestAnimationFrame(update);
		}

		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);

		return () => {
			if (frame !== 0) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	});

	return {
		get activeId() {
			return activeId;
		}
	};
}
