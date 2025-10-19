import { error, type HttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { EventDetail, EventSummary } from '$lib/types/events';

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
		let previousEventId: string | null = null;
		let nextEventId: string | null = null;

		try {
			const listResponse = await fetch('/api/events');

			if (listResponse.ok) {
				const events = (await listResponse.json()) as EventSummary[];
				const eventIndex = events.findIndex(
					(item) => typeof item?.id === 'string' && item.id.trim() === id
				);

				if (eventIndex !== -1) {
					const previous = events[eventIndex + 1];
					const next = events[eventIndex - 1];

					if (previous && typeof previous.id === 'string' && previous.id.trim().length > 0) {
						previousEventId = previous.id.trim();
					}

					if (next && typeof next.id === 'string' && next.id.trim().length > 0) {
						nextEventId = next.id.trim();
					}
				}
			} else if (listResponse.status !== 401) {
				const detail = await listResponse.text();
				console.error('Failed to load events list for navigation', detail);
			}
		} catch (err) {
			console.error('Unexpected error while loading events list for navigation', err);
		}

		return { event, previousEventId, nextEventId };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err as HttpError;
		}
		console.error('Unexpected error while loading event', err);
		throw error(500, 'Unexpected error while loading event');
	}
};
