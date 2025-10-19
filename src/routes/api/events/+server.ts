import { json, error } from '@sveltejs/kit';
import {
	clampValence,
	normalizeAssociationCollection,
	normalizeEmotionCollection,
	normalizeEventValence,
	normalizeKind,
	normalizeOptionalValence,
	normalizeResponseCollection,
	normalizeText,
	normalizeTime
} from '$lib/server/event-normalize';
import type { RequestHandler } from './$types';

export type EmotionPayload = {
	emotion_id: string;
	valence?: number;
};

export type AssociationPayload = {
	association_id: string;
	valence?: number;
};

export type ResponsePayload = {
	question_id: string;
	value: string;
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
	p_responses?: ResponsePayload[];
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
		p_associations: normalizeAssociationCollection(payload.p_associations),
		p_responses: normalizeResponseCollection(payload.p_responses)
	};

	const { data, error } = await supabase.rpc('upsert_event_full', rpcArgs);

	if (error) {
		console.error('upsert_event_full failed', error);
		return json({ message: 'Unable to save event', details: error.message }, { status: 500 });
	}

	return json({ id: data ?? null });
};

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!supabase || !user) {
		throw error(401, 'Authentication required');
	}

	const limitParam = url.searchParams.get('limit');
	const offsetParam = url.searchParams.get('offset');
	const parsedLimit = limitParam === null ? 50 : Number(limitParam);
	const parsedOffset = offsetParam === null ? 0 : Number(offsetParam);

	const filters = {
		kind: url.searchParams.get('kind'),
		from: url.searchParams.get('from'),
		to: url.searchParams.get('to'),
		limit: Number.isFinite(parsedLimit) ? parsedLimit : 50,
		offset: Number.isFinite(parsedOffset) ? parsedOffset : 0
	};

	const { data, error: err } = await supabase.rpc('get_events', { filters });

	if (err) {
		console.error('get_events failed', err);
		throw error(500, err.message);
	}

	return json(data);
};
