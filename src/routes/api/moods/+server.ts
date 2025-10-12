import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type EmotionPayload = {
	emotion_id: string;
	scale_type: string;
	value: number;
};

type AssociationPayload = {
	association_id: string;
	scale_type: string;
	value: number;
};

type UpsertMoodPayload = {
	p_profile_id: string;
	p_kind: string;
	p_valence: string;
	p_occurrence_date: string;
	p_occurrence_time: string | null;
	p_emotions?: EmotionPayload[];
	p_associations?: AssociationPayload[];
};

const normalizeCollection = <T extends Record<string, unknown>>(
	items: T[] | undefined,
	options: {
		key: (item: T) => string | null;
		omitZeroIntensity?: boolean;
	}
): T[] => {
	if (!Array.isArray(items)) return [];
	const map = new Map<string, T>();

	for (const item of items) {
		if (!item || typeof item !== 'object') continue;
		const identifier = options.key(item);
		if (!identifier) continue;
		const value = Number((item as { value?: number }).value ?? 0);
		if (options.omitZeroIntensity && (item as { scale_type?: string }).scale_type === 'intensity') {
			if (value <= 0) {
				continue;
			}
		}

		map.set(identifier, {
			...item,
			value
		});
	}

	return Array.from(map.values());
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: UpsertMoodPayload;
	try {
		payload = (await request.json()) as UpsertMoodPayload;
	} catch (err) {
		return json(
			{ message: 'Invalid JSON payload', details: err instanceof Error ? err.message : undefined },
			{ status: 400 }
		);
	}

	const requiredFields: Array<keyof UpsertMoodPayload> = [
		'p_profile_id',
		'p_kind',
		'p_valence',
		'p_occurrence_date'
	];

	for (const field of requiredFields) {
		if (!payload[field]) {
			return json({ message: `Missing required field: ${field}` }, { status: 400 });
		}
	}

	const rpcArgs: UpsertMoodPayload = {
		p_profile_id: user.id, // enforce authenticated profile
		p_kind: payload.p_kind,
		p_valence: payload.p_valence,
		p_occurrence_date: payload.p_occurrence_date,
		p_occurrence_time: payload.p_occurrence_time ?? null,
		p_emotions: normalizeCollection(payload.p_emotions, {
			key: (item) => String((item as EmotionPayload).emotion_id ?? ''),
			omitZeroIntensity: true
		}) as EmotionPayload[],
		p_associations: normalizeCollection(payload.p_associations, {
			key: (item) => String((item as AssociationPayload).association_id ?? ''),
			omitZeroIntensity: true
		}) as AssociationPayload[]
	};

	const { data, error } = await supabase.rpc('upsert_mood_full', rpcArgs);

	if (error) {
		console.error('upsert_mood_full failed', error);
		return json({ message: 'Unable to save mood', details: error.message }, { status: 500 });
	}

	return json({ id: data ?? null });
};
