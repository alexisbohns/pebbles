export type EventSummary = {
	id: string;
	name?: string | null;
	occurrence_date?: string | null;
	description?: string | null;
	kind?: string | null;
	valence?: number | null;
	[key: string]: unknown;
};

export type EventDetail = {
	[key: string]: unknown;
};
