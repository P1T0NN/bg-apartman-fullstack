export function isIanaTimeZone(value: string): boolean {
	const isNamedZone = value === 'UTC' || value.includes('/');

	if (!isNamedZone) return false;
	try {
		new Intl.DateTimeFormat('en', { timeZone: value });
		return true;
	} catch {
		return false;
	}
}
