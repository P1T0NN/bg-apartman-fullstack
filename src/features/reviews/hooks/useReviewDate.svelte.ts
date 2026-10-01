// SVELTE IMPORTS
import { onMount } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

// UTILS
import { DAY_IN_MS } from '@/shared/utils/date.js';

/** Refresh date-based eligibility at UTC midnight and when a sleeping tab becomes visible. */
export function useReviewDate() {
	let today = $state(new SvelteDate().toISOString().slice(0, 10));
	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		function refresh() {
			clearTimeout(timer);
			const now = Date.now();
			today = new SvelteDate(now).toISOString().slice(0, 10);
			timer = setTimeout(refresh, DAY_IN_MS - (now % DAY_IN_MS) + 50);
		}
		refresh();
		document.addEventListener('visibilitychange', refresh);
		return () => {
			clearTimeout(timer);
			document.removeEventListener('visibilitychange', refresh);
		};
	});
	return {
		get today() {
			return today;
		}
	};
}
