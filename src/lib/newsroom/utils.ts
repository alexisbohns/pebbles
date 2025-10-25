export type TranslateFn = (key: string) => string;

export function getCategoryLabel(translate: TranslateFn, category: string) {
	const key = `newsroom.categories.${category}.all.short`;
	const translated = translate(key);
	if (translated !== key) return translated;
	return formatCategoryName(category);
}

export function getActionLabel(translate: TranslateFn, category: string) {
	const key = `newsroom.categories.${category}.single.action`;
	const translated = translate(key);
	if (translated !== key) return translated;
	const fallback = translate('newsroom.categories.news.single.action');
	return fallback !== 'newsroom.categories.news.single.action' ? fallback : 'Read more';
}

function formatCategoryName(value: string) {
	return value
		.split(/[_\s]+/)
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');
}
