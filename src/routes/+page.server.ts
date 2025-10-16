import { error, type HttpError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { EventSummary } from '$lib/types/events';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const { user } = locals;

	if (!user) {
		return { events: [] };
	}

	let events: EventSummary[] = [];

	try {
		const response = await fetch('/api/events');

		if (response.status === 401) {
			return { events: [] };
		}

		if (!response.ok) {
			const detail = await response.text();
			console.error('Failed to load events', detail);
			throw error(response.status, 'Failed to load events');
		}

		events = (await response.json()) as EventSummary[];
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err as HttpError;
		}
		console.error('Unexpected error while loading events', err);
		throw error(500, 'Unexpected error while loading events');
	}

	return { events };
};
