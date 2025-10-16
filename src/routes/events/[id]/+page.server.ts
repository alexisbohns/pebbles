import { error, type HttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { EventDetail } from '$lib/types/events';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { id } = params;

	try {
		const response = await fetch(`/api/events/${id}`);

		if (response.status === 401) {
			throw error(401, 'Authentication required');
		}

		if (response.status === 404) {
			throw error(404, 'Event not found');
		}

		if (!response.ok) {
			const detail = await response.text();
			console.error('Failed to load event', detail);
			throw error(response.status, 'Failed to load event');
		}

		const event = (await response.json()) as EventDetail;

		return { event };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err as HttpError;
		}
		console.error('Unexpected error while loading event', err);
		throw error(500, 'Unexpected error while loading event');
	}
};
