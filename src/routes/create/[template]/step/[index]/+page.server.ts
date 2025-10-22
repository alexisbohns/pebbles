import { error, fail, redirect } from '@sveltejs/kit';
import { translateInstant } from '$lib';
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

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

const STEP_ERROR_KEYS = {
	templateConfigUnavailable: 'create.step.error.template_config_unavailable',
	supabaseUnavailable: 'create.step.error.supabase_unavailable',
	stepNotFound: 'create.step.error.step_not_found',
	invalidStep: 'create.step.error.invalid_step',
	invalidTemplateStep: 'create.step.error.invalid_template_step',
	propertyMisconfigured: 'create.step.error.property_misconfigured',
	dateBeforeContinuing: 'create.step.error.date_required_before_continue',
	dateRequired: 'create.step.error.date_required_to_create',
	createEventFailed: 'create.step.error.create_event_failed',
	eventCreationFailed: 'create.step.error.event_creation_failed',
	updatePropertyFailed: 'create.step.error.update_property_failed',
	eventMissingStartOver: 'create.step.error.event_missing_start_over',
	questionMisconfigured: 'create.step.error.question_misconfigured',
	clearResponseFailed: 'create.step.error.clear_response_failed',
	saveResponseFailed: 'create.step.error.save_response_failed',
	updateEmotionsFailed: 'create.step.error.update_emotions_failed',
	updateAssociationsFailed: 'create.step.error.update_associations_failed',
	unsupportedModelStep: 'create.step.error.unsupported_model_step',
	unsupportedStepType: 'create.step.error.unsupported_step_type',
	unexpectedSaveError: 'create.step.error.unexpected_save_error',
	missingEventReference: 'create.step.error.missing_event_reference',
	eventDataUnavailable: 'create.step.error.event_data_unavailable'
} as const;

const extractUserLocale = (locals: App.Locals): string | undefined => {
	const metadata = locals.user?.user_metadata as Record<string, unknown> | undefined;
	const locale = metadata?.locale;
	if (typeof locale === 'string' && locale.trim().length > 0) {
		return locale;
	}
	return undefined;
};

const createTranslate = (locals: App.Locals): TranslateFn => {
	const preferredLocale = extractUserLocale(locals);
	return (key, params) => translateInstant(key, params, preferredLocale);
};

const failWith = <T extends Record<string, unknown>>(
	status: number,
	messageKey: string,
	data: T,
	translate: TranslateFn
) =>
	fail(status, {
		...data,
		message: translate(messageKey),
		messageKey
	});

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
	const translate = createTranslate(locals);
	const { supabase } = locals;

	const parentData = await parent();
	const templateItems = parentData.templateItems as RawTemplateItem[] | undefined;

	if (!Array.isArray(templateItems)) {
		throw error(500, translate(STEP_ERROR_KEYS.templateConfigUnavailable));
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
		throw error(404, translate(STEP_ERROR_KEYS.stepNotFound));
	}

	const eventIdParam = normalizeString(url.searchParams.get('event'));
	let eventData: EventDetailRecord | null = null;

	if (eventIdParam) {
		if (!supabase) {
			throw error(500, translate(STEP_ERROR_KEYS.supabaseUnavailable));
		}

		const { data, error: fetchError } = await supabase.rpc('get_event_full', {
			event_uuid: eventIdParam
		});

		if (fetchError) {
			console.error('Failed to load event for step', fetchError);
			throw error(500, translate(STEP_ERROR_KEYS.eventDataUnavailable));
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

const readApiError = async (
	response: Response,
	fallbackKey: string,
	translate: TranslateFn
): Promise<{ message: string; messageKey?: string }> => {
	try {
		const payload = await response.json();
		if (payload && typeof payload === 'object' && 'message' in payload) {
			const message = (payload as { message?: unknown }).message;
			if (typeof message === 'string' && message.trim().length > 0) {
				return { message: message.trim() };
			}
		}
	} catch {
		// ignore
	}
	return { message: translate(fallbackKey), messageKey: fallbackKey };
};

export const actions: Actions = {
	default: async ({ request, params, locals, url, fetch }) => {
		const translate = createTranslate(locals);
		const { supabase, user } = locals;

		if (!user) {
			throw redirect(303, '/login');
		}
		if (!supabase) {
			throw error(500, translate(STEP_ERROR_KEYS.supabaseUnavailable));
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
			return failWith(400, STEP_ERROR_KEYS.invalidStep, { eventId: null }, translate);
		}

		const currentItem = templateItems[stepIndex];
		if (!currentItem) {
			return failWith(400, STEP_ERROR_KEYS.invalidTemplateStep, { eventId: null }, translate);
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
				const propertyValue = normalizeString(formData.get('value'));
				if (!property) {
					return failWith(
						400,
						STEP_ERROR_KEYS.propertyMisconfigured,
						{
							eventId: eventId || null,
							propertyValue
						},
						translate
					);
				}

				const column = mapPropertyToColumn(property);
				const value = parsePropertyValue(column, propertyValue);

				if (!eventId) {
					if (column !== 'occurrence_date') {
						return failWith(
							400,
							STEP_ERROR_KEYS.dateBeforeContinuing,
							{
								eventId: null,
								propertyValue
							},
							translate
						);
					}

					if (typeof value !== 'string' || value.trim().length === 0) {
						return failWith(
							400,
							STEP_ERROR_KEYS.dateRequired,
							{
								eventId: null,
								propertyValue
							},
							translate
						);
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
						const apiError = await readApiError(
							createResponse,
							STEP_ERROR_KEYS.createEventFailed,
							translate
						);
						return fail(createResponse.status, {
							...apiError,
							eventId: null,
							propertyValue
						});
					}

					const payload = (await createResponse.json()) as { id?: string | null };
					const createdId =
						typeof payload?.id === 'string' && payload.id.trim().length > 0
							? payload.id.trim()
							: null;

					if (!createdId) {
						return failWith(
							500,
							STEP_ERROR_KEYS.eventCreationFailed,
							{
								eventId: null,
								propertyValue
							},
							translate
						);
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
						const apiError = await readApiError(
							updateResponse,
							STEP_ERROR_KEYS.updatePropertyFailed,
							translate
						);
						return fail(updateResponse.status, {
							...apiError,
							eventId,
							propertyValue
						});
					}
				}
			} else if (currentItem.type === 'question') {
				const questionValue = normalizeString(formData.get('value'));

				if (!eventId) {
					return failWith(
						400,
						STEP_ERROR_KEYS.eventMissingStartOver,
						{
							eventId: null,
							questionValue
						},
						translate
					);
				}

				const questionId = normalizeString(currentItem.entity_id);
				if (!questionId) {
					return failWith(
						400,
						STEP_ERROR_KEYS.questionMisconfigured,
						{
							eventId,
							questionValue
						},
						translate
					);
				}

				if (questionValue.length === 0) {
					const deleteResponse = await fetch(`/api/events/${eventId}/responses/${questionId}`, {
						method: 'DELETE'
					});

					if (!deleteResponse.ok && deleteResponse.status !== 404) {
						const apiError = await readApiError(
							deleteResponse,
							STEP_ERROR_KEYS.clearResponseFailed,
							translate
						);
						return fail(deleteResponse.status, {
							...apiError,
							eventId,
							questionValue
						});
					}
				} else {
					const updateResponse = await fetch(`/api/events/${eventId}/responses/${questionId}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ value: questionValue })
					});

					if (!updateResponse.ok) {
						const apiError = await readApiError(
							updateResponse,
							STEP_ERROR_KEYS.saveResponseFailed,
							translate
						);
						return fail(updateResponse.status, {
							...apiError,
							eventId,
							questionValue
						});
					}
				}
			} else if (currentItem.type === 'model') {
				const mappingValue = normalizeString(formData.get('mapping'));

				if (!eventId) {
					return failWith(
						400,
						STEP_ERROR_KEYS.eventMissingStartOver,
						{
							eventId: null,
							mappingValue
						},
						translate
					);
				}

				const model = normalizeString(currentItem.model);
				const mappingValues = parseMappingPayload(mappingValue);

				if (model === 'emotion_mapping') {
					const payload = buildEmotionMappingsPayload(mappingValues);
					const updateResponse = await fetch(`/api/events/${eventId}/mappings/emotions`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ emotions: payload })
					});

					if (!updateResponse.ok) {
						const apiError = await readApiError(
							updateResponse,
							STEP_ERROR_KEYS.updateEmotionsFailed,
							translate
						);
						return fail(updateResponse.status, {
							...apiError,
							eventId,
							mappingValue
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
						const apiError = await readApiError(
							updateResponse,
							STEP_ERROR_KEYS.updateAssociationsFailed,
							translate
						);
						return fail(updateResponse.status, {
							...apiError,
							eventId,
							mappingValue
						});
					}
				} else {
					return failWith(
						400,
						STEP_ERROR_KEYS.unsupportedModelStep,
						{
							eventId,
							mappingValue
						},
						translate
					);
				}
			} else {
				return failWith(400, STEP_ERROR_KEYS.unsupportedStepType, { eventId }, translate);
			}
		} catch (err) {
			console.error('Unexpected error while processing wizard step', err);
			return failWith(
				500,
				STEP_ERROR_KEYS.unexpectedSaveError,
				{
					eventId: eventId ?? null
				},
				translate
			);
		}

		if (!eventId) {
			return failWith(
				500,
				STEP_ERROR_KEYS.missingEventReference,
				{
					eventId: null
				},
				translate
			);
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
