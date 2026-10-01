export function formatRatingAverage(rating: number, locale: string): string {
	return new Intl.NumberFormat(locale, {
		maximumFractionDigits: 1,
		minimumFractionDigits: 1
	}).format(rating);
}
