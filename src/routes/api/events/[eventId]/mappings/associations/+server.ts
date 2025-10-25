import { json } from '@sveltejs/kit';
import { normalizeEventValence, normalizeOptionalValence } from '$lib/server/event-normalize';
import type { RequestHandler } from './$types';

type AssociationMappingInput = {
	association_id?: unknown;
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
		.from('event_associations')
		.select('association_id,valence')
		.eq('event_id', eventId);

	if (error) {
		console.error('Failed to load association mappings', error);
		return json(
			{ message: 'Unable to load association mappings', details: error.message },
			{ status: 500 }
		);
	}

	return json({ associations: data ?? [] });
};

type UpdateAssociationMappingsPayload = {
	associations?: AssociationMappingInput[];
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { eventId } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: UpdateAssociationMappingsPayload;
	try {
		payload = (await request.json()) as UpdateAssociationMappingsPayload;
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

	const rawAssociations = payload.associations;
	if (!Array.isArray(rawAssociations)) {
		return json({ message: 'Payload must include an associations array' }, { status: 400 });
	}

	const dedupe = new Map<string, { association_id: string; valence?: number }>();
	for (const entry of rawAssociations) {
		if (!entry || typeof entry !== 'object') continue;
		const associationId = String(entry.association_id ?? '').trim();
		if (!associationId) continue;

		const valence = normalizeOptionalValence(entry.valence);
		const normalized =
			valence === undefined
				? { association_id: associationId }
				: { association_id: associationId, valence };
		dedupe.set(associationId, normalized);
	}

	const sanitized = Array.from(dedupe.values());

	const { error: rpcError } = await supabase.rpc('update_association_mappings', {
		p_event_id: eventId,
		p_associations: sanitized,
		p_event_valence: normalizeEventValence(eventRecord.valence)
	});

	if (rpcError) {
		console.error('update_association_mappings failed', rpcError);
		return json(
			{ message: 'Unable to update association mappings', details: rpcError.message },
			{ status: rpcError.code === '42501' ? 403 : 500 }
		);
	}

	return json({ associations: sanitized });
};
