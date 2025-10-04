import { error } from '@sveltejs/kit';
import { getLocalesFor, hasSlug, renderMarkdown, type PageSlug } from '$lib/content/catalog';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ params }) => {
	const { slug } = params;

	if (!slug || !hasSlug(slug)) {
		throw error(404, 'Page not found');
	}

	const markdownByLocale = getLocalesFor(slug as PageSlug);

	if (!markdownByLocale) {
		throw error(404, 'Page not found');
	}

	const renderedEntries = await Promise.all(
		Object.entries(markdownByLocale).map(async ([locale, markdown]) => {
			const html = await renderMarkdown(markdown);
			return [locale, html] as const;
		})
	);

	return {
		slug,
		rendered: Object.fromEntries(renderedEntries) as Record<string, string>
	};
};
