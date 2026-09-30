/** Join name parts into a display name, dropping blank values. */
export function formatFullName(...parts: Array<string | null | undefined>): string {
	return parts
		.map((part) => part?.trim())
		.filter(Boolean)
		.join(' ');
}
