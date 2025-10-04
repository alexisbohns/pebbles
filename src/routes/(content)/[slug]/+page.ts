import { error } from '@sveltejs/kit';
import {
	availablePages,
	getLocalesFor,
	hasSlug,
	type PageSlug
} from '$lib/content/catalog';
import { Lexer } from 'marked';
import type { Token } from 'marked';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => availablePages.map((slug) => ({ slug }));

export const load: PageLoad = async ({ params }) => {
	const { slug } = params;

	if (!slug || !hasSlug(slug)) {
		throw error(404, 'Page not found');
	}

	const markdownByLocale = getLocalesFor(slug as PageSlug);

	if (!markdownByLocale) {
		throw error(404, 'Page not found');
	}

	return {
		slug,
		tokens: Object.fromEntries(
			Object.entries(markdownByLocale).map(([locale, markdown]) => {
				const tokens = Lexer.lex(markdown) as Token[];
				return [locale, tokens] as const;
			})
		) as Record<string, Token[]>
	};
};
