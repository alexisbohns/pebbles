import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type EmotionPayload = {
	emotion_id: string;
	valence?: number;
};

type AssociationPayload = {
	association_id: string;
	valence?: number;
};

type UpsertEventPayload = {
	p_profile_id: string;
	p_kind: string;
	p_valence: number;
	p_occurrence_date: string;
	p_occurrence_time: string | null;
	p_name?: string;
	p_description?: string;
	p_emotions?: EmotionPayload[];
	p_associations?: AssociationPayload[];
};

const clampValence = (value: number): number => {
	if (!Number.isFinite(value)) return 0;
	return Math.max(-3, Math.min(3, Math.round(value)));
};

const normalizeEventValence = (value: unknown): number => {
	if (typeof value === 'number') {
		return clampValence(value);
	}

	if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isNaN(parsed)) {
			return clampValence(parsed);
		}
	}

	return 0;
};

const normalizeOptionalValence = (value: unknown): number | undefined => {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'number') {
		return clampValence(value);
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isNaN(parsed)) {
			return clampValence(parsed);
		}
	}
	return undefined;
};

const normalizeText = (value: unknown): string => {
	if (typeof value !== 'string') return '';
	return value.trim();
};

const normalizeKind = (value: unknown): string => {
	if (value === 'moment' || value === 'day') {
		return value;
	}
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'day';
};

const normalizeTime = (value: unknown): string | null => {
	if (value === null || value === undefined || value === '') {
		return null;
	}
	if (typeof value === 'string') {
		return value;
	}
	return null;
};

const normalizeEmotionCollection = (items: EmotionPayload[] | undefined): EmotionPayload[] => {
	if (!Array.isArray(items)) return [];
	const map = new Map<string, EmotionPayload>();

	for (const item of items) {
		if (!item || typeof item !== 'object') continue;
		const emotionId = String((item as EmotionPayload).emotion_id ?? '').trim();
		if (!emotionId) continue;

		const normalized: EmotionPayload = {
			emotion_id: emotionId
		};

		const valence = normalizeOptionalValence((item as EmotionPayload).valence);
		if (valence !== undefined) {
			normalized.valence = valence;
		}

		map.set(emotionId, normalized);
	}

	return Array.from(map.values());
};

const normalizeAssociationCollection = (
	items: AssociationPayload[] | undefined
): AssociationPayload[] => {
	if (!Array.isArray(items)) return [];
	const map = new Map<string, AssociationPayload>();

	for (const item of items) {
		if (!item || typeof item !== 'object') continue;
		const associationId = String((item as AssociationPayload).association_id ?? '').trim();
		if (!associationId) continue;

		const normalized: AssociationPayload = {
			association_id: associationId
		};

		const valence = normalizeOptionalValence((item as AssociationPayload).valence);
		if (valence !== undefined) {
			normalized.valence = valence;
		}

		map.set(associationId, normalized);
	}

	return Array.from(map.values());
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: UpsertEventPayload;
	try {
		payload = (await request.json()) as UpsertEventPayload;
	} catch (err) {
		return json(
			{ message: 'Invalid JSON payload', details: err instanceof Error ? err.message : undefined },
			{ status: 400 }
		);
	}

	const requiredFields: Array<keyof UpsertEventPayload> = [
		'p_kind',
		'p_valence',
		'p_occurrence_date'
	];

	for (const field of requiredFields) {
		if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
			return json({ message: `Missing required field: ${field}` }, { status: 400 });
		}
	}

	const rpcArgs: UpsertEventPayload = {
		p_profile_id: user.id, // enforce authenticated profile
		p_kind: normalizeKind(payload.p_kind),
		p_valence: normalizeEventValence(payload.p_valence),
		p_occurrence_date: payload.p_occurrence_date,
		p_occurrence_time: normalizeTime(payload.p_occurrence_time),
		p_name: normalizeText(payload.p_name),
		p_description: normalizeText(payload.p_description),
		p_emotions: normalizeEmotionCollection(payload.p_emotions),
		p_associations: normalizeAssociationCollection(payload.p_associations)
	};

	const { data, error } = await supabase.rpc('upsert_event_full', rpcArgs);

	if (error) {
		console.error('upsert_event_full failed', error);
		return json({ message: 'Unable to save event', details: error.message }, { status: 500 });
	}

	return json({ id: data ?? null });
};
