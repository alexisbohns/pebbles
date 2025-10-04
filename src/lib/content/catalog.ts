const rawPages = import.meta.glob('./**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export type ContentCatalog = Record<string, Record<string, string>>;

const catalog: ContentCatalog = {};

for (const [path, content] of Object.entries(rawPages)) {
	const match = path.match(/\.\/(.+?)\/([^.]+)\.md$/);
	if (!match) continue;
	const [, slug, locale] = match;
	catalog[slug] ??= {};
	catalog[slug][locale] = content;
}

export type PageSlug = keyof typeof catalog extends string ? keyof typeof catalog : string;

export function getLocalesFor(slug: PageSlug) {
	return catalog[slug];
}

export function hasSlug(slug: string): slug is PageSlug {
	return slug in catalog;
}

export const availablePages = Object.keys(catalog);
