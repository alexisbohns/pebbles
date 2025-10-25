import { error } from '@sveltejs/kit';
import { NEWSROOM_CATEGORIES, type NewsroomRecord } from '$lib/newsroom/types';
import { normalizeNewsroomRecord, type RawNewsroomRecord } from './normalizer';
import type { PageServerLoad } from './$types';

const ORDERED_CATEGORIES = NEWSROOM_CATEGORIES;

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = locals;

	if (!supabase) {
		throw error(500, 'Supabase client unavailable');
	}

	const { data, error: queryError } = await supabase
		.from('newsroom')
		.select(
			'id, created_at, category, published, name, name_en, description, description_en, content, content_en, resource'
		)
		.eq('published', true);

	if (queryError) {
		throw error(500, 'Unable to load newsroom');
	}

	const records = (data ?? []) as RawNewsroomRecord[];

	const items = records
		.map((record) => normalizeNewsroomRecord(record))
		.filter((record): record is NewsroomRecord => record !== null)
		.sort((a, b) => {
			const dateA = new Date(a.created_at).getTime();
			const dateB = new Date(b.created_at).getTime();
			return dateB - dateA;
		});

	const availableCategories = ORDERED_CATEGORIES.filter((category) =>
		items.some((item) => item.category === category)
	);

	return {
		items,
		availableCategories
	};
};
