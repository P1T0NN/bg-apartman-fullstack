/** Select handwritten backend copy using the frontend locale, with English fallback. */
export function getTranslationLocale<T>(
	locale: string,
	translations: { en: T } & Record<string, T | undefined>
): T {
	const hasTranslation = Object.hasOwn(translations, locale);
	return (hasTranslation ? translations[locale] : undefined) ?? translations.en;
}
