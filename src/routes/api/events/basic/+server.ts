import { json } from '@sveltejs/kit';
import {
	normalizeEventValence,
	normalizeKind,
	normalizeText,
	normalizeTime
} from '$lib/server/event-normalize';
import type { RequestHandler } from './$types';

type CreateEventPayload = {
	occurrence_date?: string;
	occurrence_time?: string | null;
	kind?: string;
	valence?: number | string;
	name?: string;
	description?: string;
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!supabase || !user) {
		return json({ message: 'Authentication required' }, { status: 401 });
	}

	let payload: CreateEventPayload;
	try {
		payload = (await request.json()) as CreateEventPayload;
	} catch (err) {
		return json(
			{ message: 'Invalid JSON payload', details: err instanceof Error ? err.message : undefined },
			{ status: 400 }
		);
	}

	const occurrenceDate = normalizeText(payload.occurrence_date);
	if (!occurrenceDate) {
		return json({ message: 'occurrence_date is required' }, { status: 400 });
	}

	const normalizedName = normalizeText(payload.name);
	const normalizedDescription = normalizeText(payload.description);

	const eventRecord = {
		profile_id: user.id,
		occurrence_date: occurrenceDate,
		occurrence_time: normalizeTime(payload.occurrence_time),
		kind: normalizeKind(payload.kind),
		valence: normalizeEventValence(payload.valence),
		name: normalizedName.length > 0 ? normalizedName : null,
		description: normalizedDescription.length > 0 ? normalizedDescription : null
	};

	const { data, error: insertError } = await supabase
		.from('events')
		.insert(eventRecord)
		.select('id')
		.single<{ id: string }>();

	if (insertError) {
		console.error('Failed to create event', insertError);
		return json(
			{
				message: 'Unable to create event',
				details: insertError.message
			},
			{ status: 500 }
		);
	}

	return json({ id: data?.id ?? null }, { status: 201 });
};
