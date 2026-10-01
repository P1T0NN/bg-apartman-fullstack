/** Observe once for lazy mounting; visibility stays true after the first intersection. */
export function useObserver(options: IntersectionObserverInit = {}) {
	let visible = $state(false);

	function observe(element: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				visible = true;
				observer.disconnect();
			}
		}, options);
		observer.observe(element);
		return () => observer.disconnect();
	}

	return {
		observe,
		get visible() {
			return visible;
		}
	};
}
