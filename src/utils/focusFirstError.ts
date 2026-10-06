// LIBRARIES
import { flushSync } from 'svelte';

/**
 * Focus and reveal the first field inside `container` flagged with `aria-invalid`.
 * Pass `errors` to skip the work when no error is set.
 * Pending state updates are flushed synchronously first, because callers usually
 * write validation errors right before calling and the DOM would not carry
 * `aria-invalid` until the next microtask otherwise.
 */
export function focusFirstError(container: HTMLElement, errors?: Record<string, string>): void {
	if (errors && !Object.values(errors).some(Boolean)) return;

	flushSync();

	const field = container.querySelector<HTMLElement>('[aria-invalid="true"]');
	if (!field) return;
	field.focus({ preventScroll: true });
	field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
