import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		throw error(401, 'Authentication required');
	}

	const { data, error: err } = await supabase.rpc('get_event_full', { event_uuid: id });

	if (err) {
		console.error('get_event_full failed', err);
		throw error(500, err.message);
	}

	if (!data) {
		throw error(404, 'Event not found');
	}

	return json(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { id } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch (err) {
		return json(
			{ message: 'Invalid JSON payload', details: err instanceof Error ? err.message : undefined },
			{ status: 400 }
		);
	}

	const patchCandidate =
		payload &&
		typeof payload === 'object' &&
		!Array.isArray(payload) &&
		'patch' in (payload as object)
			? (payload as { patch: unknown }).patch
			: payload;

	if (!patchCandidate || typeof patchCandidate !== 'object' || Array.isArray(patchCandidate)) {
		return json({ message: 'Body must contain a patch object' }, { status: 400 });
	}

	if (Object.keys(patchCandidate).length === 0) {
		return json({ message: 'Patch object cannot be empty' }, { status: 400 });
	}

	const { data, error: rpcError } = await supabase.rpc('update_event_field', {
		p_event_id: id,
		p_patch: patchCandidate
	});

	if (rpcError) {
		console.error('update_event_field failed', rpcError);
		return json({ message: 'Unable to update event', details: rpcError.message }, { status: 500 });
	}

	return json({ event: data ?? null });
};
