// SVELTEKIT IMPORTS
import { onMount } from 'svelte';

/** Refresh instant-based eligibility each minute and when a sleeping tab becomes visible. */
export function useClock() {
	let now = $state(Date.now());

	onMount(() => {
		const refresh = () => {
			now = Date.now();
		};
		refresh();
		const timer = setInterval(refresh, 60_000);
		document.addEventListener('visibilitychange', refresh);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', refresh);
		};
	});
	return {
		get now() {
			return now;
		}
	};
}
