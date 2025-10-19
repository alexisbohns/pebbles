import { json } from '@sveltejs/kit';
import { normalizeText } from '$lib/server/event-normalize';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { eventId, questionId } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	const { data, error } = await supabase
		.from('event_responses')
		.select('value')
		.eq('event_id', eventId)
		.eq('question_id', questionId)
		.eq('profile_id', user.id)
		.maybeSingle<{ value: string | null }>();

	if (error) {
		console.error('Failed to load response', error);
		return json({ message: 'Unable to load response', details: error.message }, { status: 500 });
	}

	if (!data) {
		return json({ message: 'Response not found' }, { status: 404 });
	}

	return json({ value: data.value ?? '' });
};

type UpdateResponsePayload = {
	value?: unknown;
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { eventId, questionId } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: UpdateResponsePayload;
	try {
		payload = (await request.json()) as UpdateResponsePayload;
	} catch (err) {
		return json(
			{ message: 'Invalid JSON payload', details: err instanceof Error ? err.message : undefined },
			{ status: 400 }
		);
	}

	const normalizedValue = normalizeText(payload.value);

	const { error: rpcError } = await supabase.rpc('update_response_value', {
		p_event_id: eventId,
		p_question_id: questionId,
		p_value: normalizedValue
	});

	if (rpcError) {
		console.error('update_response_value failed', rpcError);
		return json(
			{ message: 'Unable to upsert response', details: rpcError.message },
			{ status: rpcError.code === '42501' ? 403 : 500 }
		);
	}

	return json({ value: normalizedValue });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { eventId, questionId } = params;
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	const { error: rpcError } = await supabase.rpc('update_response_value', {
		p_event_id: eventId,
		p_question_id: questionId,
		p_value: null
	});

	if (rpcError) {
		console.error('update_response_value delete failed', rpcError);
		return json(
			{ message: 'Unable to delete response', details: rpcError.message },
			{ status: rpcError.code === '42501' ? 403 : 500 }
		);
	}

	return json({ success: true });
};
