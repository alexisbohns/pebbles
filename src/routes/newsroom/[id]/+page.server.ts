import { error } from '@sveltejs/kit';
import { Lexer } from 'marked';
import type { Token } from 'marked';
import { normalizeNewsroomRecord, type RawNewsroomRecord } from '../normalizer';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	if (!id) {
		throw error(404, 'Newsroom entry not found');
	}

	const { supabase } = locals;

	if (!supabase) {
		throw error(500, 'Supabase client unavailable');
	}

	const { data, error: queryError } = await supabase
		.from('newsroom')
		.select(
			'id, created_at, category, published, name, name_en, description, description_en, content, content_en, resource'
		)
		.eq('id', id)
		.maybeSingle();

	if (queryError) {
		throw error(500, 'Unable to load newsroom entry');
	}

	const normalized = normalizeNewsroomRecord((data ?? null) as RawNewsroomRecord | null);

	if (!normalized) {
		throw error(404, 'Newsroom entry not found');
	}

	const tokensByLocale: Record<string, Token[]> = {};

	if (normalized.content) {
		tokensByLocale.fr = Lexer.lex(normalized.content) as Token[];
	}

	if (normalized.content_en) {
		tokensByLocale.en = Lexer.lex(normalized.content_en) as Token[];
	}

	return {
		item: normalized,
		tokens: tokensByLocale
	};
};
