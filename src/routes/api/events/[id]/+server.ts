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
