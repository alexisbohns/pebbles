export const NEWSROOM_CATEGORIES = [
	'changelog',
	'news',
	'incident',
	'publication_medium',
	'publication_substack',
	'publication_other',
	'reference'
] as const;

export type NewsroomCategory = (typeof NEWSROOM_CATEGORIES)[number];

export function isNewsroomCategory(candidate: string): candidate is NewsroomCategory {
	return (NEWSROOM_CATEGORIES as readonly string[]).includes(candidate);
}

export const RESOURCE_LINK_CATEGORIES: readonly NewsroomCategory[] = [
	'publication_medium',
	'publication_substack',
	'publication_other',
	'reference'
] as const;

export type NewsroomRecord = {
	id: string;
	category: string;
	created_at: string;
	published: boolean;
	name: string | null;
	name_en: string | null;
	description: string | null;
	description_en: string | null;
	content: string | null;
	content_en: string | null;
	resource: string | null;
	type: string | null;
};
