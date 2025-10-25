import type { NewsroomRecord } from '$lib/newsroom/types';

export type RawNewsroomRecord = {
	id: number | string | null;
	created_at: string | null;
	category: string | null;
	published: boolean | null;
	name: string | null;
	name_en: string | null;
	description: string | null;
	description_en: string | null;
	content: string | null;
	content_en: string | null;
	resource: string | null;
	type?: string | null;
};

export function normalizeNewsroomRecord(
	record: RawNewsroomRecord | null | undefined
): NewsroomRecord | null {
	if (!record) return null;

	const publishedValue = record.published === true;

	if (!publishedValue) return null;

	const id = record.id != null ? String(record.id) : null;
	if (!id) return null;

	const category =
		typeof record.category === 'string' && record.category.trim().length > 0
			? record.category
			: null;

	if (!category) return null;

	return {
		id,
		category,
		created_at: record.created_at ?? '',
		published: publishedValue,
		name: record.name ?? null,
		name_en: record.name_en ?? null,
		description: record.description ?? null,
		description_en: record.description_en ?? null,
		content: record.content ?? null,
		content_en: record.content_en ?? null,
		resource: record.resource ?? null,
		type: typeof record.type === 'string' ? record.type : null
	};
}
