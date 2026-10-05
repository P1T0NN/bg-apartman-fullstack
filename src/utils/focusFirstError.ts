export function focusFirstError(container: HTMLElement): void {
	const field = container.querySelector<HTMLElement>('[aria-invalid="true"]');
	if (!field) return;
	field.focus({ preventScroll: true });
	field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
