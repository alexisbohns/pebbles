import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { buildTemplateContext, type RawTemplateItem } from '../../template-context.server';

type MappingFormValue = {
	id: string;
	kind: 'selection' | 'intensity';
	value?: number;
};

type EventDetailRecord = Record<string, unknown> & {
	id?: string;
};

const PROPERTY_COLUMN_MAP: Record<string, string> = {
	date: 'occurrence_date',
	time: 'occurrence_time'
};

const clampValence = (value: number): number => {
	if (!Number.isFinite(value)) return 0;
	if (value < -3) return -3;
	if (value > 3) return 3;
	return Math.round(value);
};

const mapPropertyToColumn = (property: string): string => PROPERTY_COLUMN_MAP[property] ?? property;

const normalizeString = (value: unknown): string => {
	if (typeof value !== 'string') return '';
	return value.trim();
};

const parsePropertyValue = (column: string, rawValue: string): unknown => {
	const trimmed = rawValue.trim();

	if (column === 'occurrence_date') {
		return trimmed;
	}

	if (column === 'occurrence_time') {
		return trimmed.length === 0 ? null : trimmed;
	}

	if (column === 'valence') {
		const parsed = Number.parseInt(trimmed, 10);
		if (Number.isNaN(parsed)) return 0;
		return clampValence(parsed);
	}

	if (trimmed.length === 0) {
		return null;
	}

	return trimmed;
};

const parseOptionalValence = (value: unknown): number | undefined => {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'number' && Number.isFinite(value)) {
		return clampValence(value);
	}
	if (typeof value === 'string' && value.trim().length > 0) {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isNaN(parsed)) {
			return clampValence(parsed);
		}
	}
	return undefined;
};

const parseMappingPayload = (raw: unknown): MappingFormValue[] => {
	if (typeof raw !== 'string' || raw.trim().length === 0) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw) as MappingFormValue[];
		if (!Array.isArray(parsed)) return [];

		const map = new Map<string, MappingFormValue>();
		for (const entry of parsed) {
			if (!entry || typeof entry !== 'object') continue;
			const id = normalizeString((entry as MappingFormValue).id);
			const kind = (entry as MappingFormValue).kind;
			if (!id || (kind !== 'selection' && kind !== 'intensity')) continue;

			if (kind === 'intensity') {
				const value = parseOptionalValence((entry as MappingFormValue).value);
				map.set(id, value === undefined ? { id, kind: 'selection' } : { id, kind, value });
				continue;
			}

			map.set(id, { id, kind: 'selection' });
		}

		return Array.from(map.values());
	} catch (err) {
		console.error('Failed to parse mapping payload', err);
		return [];
	}
};

const resolveDefaultKind = (configDefaults: Record<string, unknown>): string => {
	const rawKind = configDefaults.kind;
	if (typeof rawKind === 'string' && rawKind.trim().length > 0) {
		return rawKind.trim();
	}
	return 'moment';
};

const resolveDefaultValence = (configDefaults: Record<string, unknown>): number => {
	const rawValence = configDefaults.valence;
	if (typeof rawValence === 'number') {
		return clampValence(rawValence);
	}
	if (typeof rawValence === 'string' && rawValence.trim().length > 0) {
		const parsed = Number.parseInt(rawValence, 10);
		if (!Number.isNaN(parsed)) {
			return clampValence(parsed);
		}
	}
	return 0;
};

export const load: PageServerLoad = async ({ params, url, parent, locals }) => {
	const { supabase } = locals;

	const parentData = await parent();
	const templateItems = parentData.templateItems as RawTemplateItem[] | undefined;

	if (!Array.isArray(templateItems)) {
		throw error(500, 'Template configuration unavailable');
	}

	const stepIndex = Number.parseInt(params.index, 10);
	if (!Number.isFinite(stepIndex) || stepIndex < 0) {
		throw redirect(303, `/create/${params.template}/step/0${url.search}`);
	}

	const totalSteps = templateItems.length;
	if (stepIndex >= totalSteps) {
		const eventIdParam = normalizeString(url.searchParams.get('event'));
		if (eventIdParam) {
			throw redirect(303, `/events/${eventIdParam}`);
		}
		throw redirect(303, `/create/${params.template}`);
	}

	const currentItem = templateItems[stepIndex] ?? null;
	if (!currentItem) {
		throw error(404, 'Step not found');
	}

	const eventIdParam = normalizeString(url.searchParams.get('event'));
	let eventData: EventDetailRecord | null = null;

	if (eventIdParam) {
		if (!supabase) {
			throw error(500, 'Supabase client unavailable');
		}

		const { data, error: fetchError } = await supabase.rpc('get_event_full', {
			event_uuid: eventIdParam
		});

		if (fetchError) {
			console.error('Failed to load event for step', fetchError);
			throw error(500, 'Unable to load event data');
		}

		eventData = data ?? null;
	} else if (stepIndex > 0) {
		throw redirect(303, `/create/${params.template}/step/0`);
	}

	return {
		currentItem,
		currentIndex: stepIndex,
		totalSteps,
		eventId: eventIdParam || null,
		eventData
	};
};

const buildEmotionMappingsPayload = (values: MappingFormValue[]) => {
	const map = new Map<string, { emotion_id: string; valence?: number }>();
	for (const entry of values) {
		const id = normalizeString(entry.id);
		if (!id) continue;
		if (entry.kind === 'intensity' && typeof entry.value === 'number') {
			map.set(id, { emotion_id: id, valence: clampValence(entry.value) });
		} else {
			map.set(id, { emotion_id: id });
		}
	}
	return Array.from(map.values());
};

const buildAssociationMappingsPayload = (values: MappingFormValue[]) => {
	const map = new Map<string, { association_id: string; valence?: number }>();
	for (const entry of values) {
		const id = normalizeString(entry.id);
		if (!id) continue;
		if (entry.kind === 'intensity' && typeof entry.value === 'number') {
			map.set(id, { association_id: id, valence: clampValence(entry.value) });
		} else {
			map.set(id, { association_id: id });
		}
	}
	return Array.from(map.values());
};

const readApiError = async (response: Response, fallback: string) => {
	try {
		const payload = await response.json();
		if (payload && typeof payload === 'object' && 'message' in payload) {
			const message = (payload as { message?: unknown }).message;
			if (typeof message === 'string' && message.trim().length > 0) {
				return message.trim();
			}
		}
	} catch {
		// ignore
	}
	return fallback;
};

export const actions: Actions = {
	default: async ({ request, params, locals, url, fetch }) => {
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}
		if (!supabase) {
			throw error(500, 'Supabase client unavailable');
		}

		const formData = await request.formData();
		const rawIntent = normalizeString(formData.get('intent'));
		const intent = rawIntent === 'previous' ? 'previous' : rawIntent === 'stay' ? 'stay' : 'next';

		const context = await buildTemplateContext({
			supabase,
			templateName: params.template
		});

		const templateItems = context.templateItems;
		const stepIndex = Number.parseInt(params.index, 10);
		if (!Number.isFinite(stepIndex) || stepIndex < 0 || stepIndex >= templateItems.length) {
			return fail(400, { message: 'Invalid step', eventId: null });
		}

		const currentItem = templateItems[stepIndex];
		if (!currentItem) {
			return fail(400, { message: 'Invalid template step', eventId: null });
		}

		const totalSteps = templateItems.length;
		const previousIndex = stepIndex > 0 ? stepIndex - 1 : null;
		const nextIndex = stepIndex < totalSteps - 1 ? stepIndex + 1 : null;

		const defaults = (context.config.model_properties ?? {}) as Record<string, unknown>;

		let eventId =
			normalizeString(formData.get('eventId')) || normalizeString(url.searchParams.get('event'));

		try {
			if (currentItem.type === 'property') {
				const property = normalizeString(currentItem.property);
				if (!property) {
					return fail(400, {
						message: 'Property step misconfigured',
						eventId: eventId || null,
						propertyValue: normalizeString(formData.get('value'))
					});
				}

				const column = mapPropertyToColumn(property);
				const rawValue = normalizeString(formData.get('value'));
				const value = parsePropertyValue(column, rawValue);

				if (!eventId) {
					if (column !== 'occurrence_date') {
						return fail(400, {
							message: 'Please provide the event date before continuing.',
							eventId: null,
							propertyValue: rawValue
						});
					}

					if (typeof value !== 'string' || value.trim().length === 0) {
						return fail(400, {
							message: 'Date is required to create the event.',
							eventId: null,
							propertyValue: rawValue
						});
					}

					const createResponse = await fetch('/api/events/basic', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							occurrence_date: value.trim(),
							occurrence_time:
								typeof defaults.time === 'string' && defaults.time.trim().length > 0
									? defaults.time.trim()
									: null,
							kind: resolveDefaultKind(defaults),
							valence: resolveDefaultValence(defaults),
							name:
								typeof defaults.name === 'string' && defaults.name.trim().length > 0
									? defaults.name.trim()
									: undefined,
							description:
								typeof defaults.description === 'string' && defaults.description.trim().length > 0
									? defaults.description.trim()
									: undefined
						})
					});

					if (!createResponse.ok) {
						const message = await readApiError(
							createResponse,
							'Unable to create event. Please try again.'
						);
						return fail(createResponse.status, {
							message,
							eventId: null,
							propertyValue: rawValue
						});
					}

					const payload = (await createResponse.json()) as { id?: string | null };
					const createdId =
						typeof payload?.id === 'string' && payload.id.trim().length > 0
							? payload.id.trim()
							: null;

					if (!createdId) {
						return fail(500, {
							message: 'Event creation failed. Please try again.',
							eventId: null,
							propertyValue: rawValue
						});
					}

					eventId = createdId;
				} else {
					const patch = {
						[column]: value
					};

					const updateResponse = await fetch(`/api/events/${eventId}`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ patch })
					});

					if (!updateResponse.ok) {
						const message = await readApiError(
							updateResponse,
							'Unable to save property. Please try again.'
						);
						return fail(updateResponse.status, {
							message,
							eventId,
							propertyValue: rawValue
						});
					}
				}
			} else if (currentItem.type === 'question') {
				if (!eventId) {
					return fail(400, {
						message: 'Event not found. Start from the first step.',
						eventId: null,
						questionValue: normalizeString(formData.get('value'))
					});
				}

				const questionId = normalizeString(currentItem.entity_id);
				if (!questionId) {
					return fail(400, {
						message: 'Question step misconfigured.',
						eventId,
						questionValue: normalizeString(formData.get('value'))
					});
				}

				const value = normalizeString(formData.get('value'));
				if (value.length === 0) {
					const deleteResponse = await fetch(`/api/events/${eventId}/responses/${questionId}`, {
						method: 'DELETE'
					});

					if (!deleteResponse.ok && deleteResponse.status !== 404) {
						const message = await readApiError(
							deleteResponse,
							'Unable to clear response. Please try again.'
						);
						return fail(deleteResponse.status, {
							message,
							eventId,
							questionValue: value
						});
					}
				} else {
					const updateResponse = await fetch(`/api/events/${eventId}/responses/${questionId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ value })
					});

					if (!updateResponse.ok) {
						const message = await readApiError(
							updateResponse,
							'Unable to save response. Please try again.'
						);
						return fail(updateResponse.status, {
							message,
							eventId,
							questionValue: value
						});
					}
				}
			} else if (currentItem.type === 'model') {
				if (!eventId) {
					return fail(400, {
						message: 'Event not found. Start from the first step.',
						eventId: null,
						mappingValue: normalizeString(formData.get('mapping'))
					});
				}

				const model = normalizeString(currentItem.model);
				const mappingValues = parseMappingPayload(normalizeString(formData.get('mapping')));

				if (model === 'emotion_mapping') {
					const payload = buildEmotionMappingsPayload(mappingValues);
					const updateResponse = await fetch(`/api/events/${eventId}/mappings/emotions`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ emotions: payload })
					});

					if (!updateResponse.ok) {
						const message = await readApiError(
							updateResponse,
							'Unable to update emotions. Please try again.'
						);
						return fail(updateResponse.status, {
							message,
							eventId,
							mappingValue: normalizeString(formData.get('mapping'))
						});
					}
				} else if (model === 'association_mapping') {
					const payload = buildAssociationMappingsPayload(mappingValues);
					const updateResponse = await fetch(`/api/events/${eventId}/mappings/associations`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ associations: payload })
					});

					if (!updateResponse.ok) {
						const message = await readApiError(
							updateResponse,
							'Unable to update associations. Please try again.'
						);
						return fail(updateResponse.status, {
							message,
							eventId,
							mappingValue: normalizeString(formData.get('mapping'))
						});
					}
				} else {
					return fail(400, {
						message: 'Unsupported model step.',
						eventId,
						mappingValue: normalizeString(formData.get('mapping'))
					});
				}
			} else {
				return fail(400, { message: 'Unsupported step type', eventId });
			}
		} catch (err) {
			console.error('Unexpected error while processing wizard step', err);
			return fail(500, {
				message: 'Unexpected error while saving. Please try again.',
				eventId: eventId ?? null
			});
		}

		if (!eventId) {
			return fail(500, { message: 'Event reference missing after save', eventId: null });
		}

		if (intent === 'previous' && previousIndex !== null) {
			throw redirect(303, `/create/${params.template}/step/${previousIndex}?event=${eventId}`);
		}

		if (intent === 'stay') {
			return { message: null, eventId };
		}

		if (nextIndex === null) {
			throw redirect(303, `/events/${eventId}`);
		}

		throw redirect(303, `/create/${params.template}/step/${nextIndex}?event=${eventId}`);
	}
};
