import { json } from '@sveltejs/kit';
import { normalizeEventValence, normalizeOptionalValence } from '$lib/server/event-normalize';
import type { RequestHandler } from './$types';

type EmotionMappingInput = {
	emotion_id?: unknown;
	valence?: unknown;
};

const ensureEventOwnership = async (
	supabase: App.Locals['supabase'],
	eventId: string,
	profileId: string
): Promise<{ id: string; valence: number | null }> => {
	const { data, error } = await supabase
		.from('events')
		.select('id,valence')
		.eq('id', eventId)
		.eq('profile_id', profileId)
		.maybeSingle();

	if (error) {
		throw json(
			{ message: 'Unable to verify event ownership', details: error.message },
			{ status: 500 }
		);
	}

	if (!data) {
		throw json({ message: 'Event not found' }, { status: 404 });
	}
	return data;
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const { eventId } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	try {
		await ensureEventOwnership(supabase, eventId, user.id);
	} catch (response) {
		if (response instanceof Response) {
			return response;
		}
		throw response;
	}

	const { data, error } = await supabase
		.from('event_emotions')
		.select('emotion_id,valence')
		.eq('event_id', eventId);

	if (error) {
		console.error('Failed to load emotion mappings', error);
		return json(
			{ message: 'Unable to load emotion mappings', details: error.message },
			{ status: 500 }
		);
	}

	return json({ emotions: data ?? [] });
};

type UpdateEmotionMappingsPayload = {
	emotions?: EmotionMappingInput[];
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { eventId } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: UpdateEmotionMappingsPayload;
	try {
		payload = (await request.json()) as UpdateEmotionMappingsPayload;
	} catch (err) {
		return json(
			{ message: 'Invalid JSON payload', details: err instanceof Error ? err.message : undefined },
			{ status: 400 }
		);
	}

	let eventRecord: { id: string; valence: number | null };
	try {
		eventRecord = await ensureEventOwnership(supabase, eventId, user.id);
	} catch (response) {
		if (response instanceof Response) {
			return response;
		}
		throw response;
	}

	const rawEmotions = payload.emotions;
	if (!Array.isArray(rawEmotions)) {
		return json({ message: 'Payload must include an emotions array' }, { status: 400 });
	}

	const dedupe = new Map<string, { emotion_id: string; valence?: number }>();
	for (const entry of rawEmotions) {
		if (!entry || typeof entry !== 'object') continue;
		const emotionId = String(entry.emotion_id ?? '').trim();
		if (!emotionId) continue;

		const valence = normalizeOptionalValence(entry.valence);
		const normalized =
			valence === undefined ? { emotion_id: emotionId } : { emotion_id: emotionId, valence };
		dedupe.set(emotionId, normalized);
	}

	const sanitized = Array.from(dedupe.values());

	const { error: rpcError } = await supabase.rpc('update_emotion_mappings', {
		p_event_id: eventId,
		p_emotions: sanitized,
		p_event_valence: normalizeEventValence(eventRecord.valence)
	});

	if (rpcError) {
		console.error('update_emotion_mappings failed', rpcError);
		return json(
			{ message: 'Unable to update emotion mappings', details: rpcError.message },
			{ status: rpcError.code === '42501' ? 403 : 500 }
		);
	}

	return json({ emotions: sanitized });
};
