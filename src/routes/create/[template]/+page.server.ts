import { error, redirect } from '@sveltejs/kit';
import { templates } from '$lib/configs/templates';
import type { PageServerLoad } from './$types';

type LookupRecord = { id: string; label: string; valence?: number | null };

type TemplateQuestion = {
	id: string;
	fieldName: string;
	label: string;
	description: string | null;
	placeholder: string | null;
};

type RawTemplateItem = {
	type?: string;
	property?: string;
	model?: string;
	entity_id?: string;
	mandatory?: boolean;
	default?: unknown;
	[key: string]: unknown;
};

const LABEL_KEYS = ['name', 'label', 'title'] as const;
const QUESTION_ID_KEYS = ['entity_id', 'id', 'uuid', 'slug'] as const;
const QUESTION_NAME_KEYS = ['name', 'slug', 'code'] as const;
const QUESTION_TITLE_KEYS = ['title', 'question', 'label', 'prompt'] as const;
const QUESTION_DESCRIPTION_KEYS = ['description', 'help_text', 'details', 'body', 'text'] as const;
const QUESTION_PLACEHOLDER_KEYS = ['placeholder', 'hint', 'example'] as const;

const resolveId = (record: Record<string, unknown>, fallbackPrefix: string, index: number) => {
	const rawId = record.id ?? record.uuid ?? record.slug ?? index;
	return String(rawId);
};

const resolveLabel = (record: Record<string, unknown>, fallbackPrefix: string, index: number) => {
	for (const key of LABEL_KEYS) {
		const value = record[key];
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim();
		}
	}

	return `${fallbackPrefix} ${index + 1}`;
};

const normalizeValence = (value: unknown): number | undefined => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		if (value === 0) return 0;
		return value < 0 ? -1 : 1;
	}

	if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);
		if (Number.isNaN(parsed)) {
			return undefined;
		}
		if (parsed === 0) {
			return 0;
		}
		return parsed < 0 ? -1 : 1;
	}

	return undefined;
};

const normalizeLookupRows = (
	rows: unknown[] | null | undefined,
	fallbackPrefix: string
): LookupRecord[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	return rows
		.map((row, index) => {
			if (!row || typeof row !== 'object') {
				return {
					id: `${fallbackPrefix}-${index}`,
					label: `${fallbackPrefix} ${index + 1}`
				};
			}

			const record = row as Record<string, unknown>;

			return {
				id: resolveId(record, fallbackPrefix, index),
				label: resolveLabel(record, fallbackPrefix, index)
			};
		})
		.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
};

const normalizeEmotionRows = (
	rows: unknown[] | null | undefined,
	fallbackPrefix: string
): LookupRecord[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	return rows
		.map((row, index) => {
			if (!row || typeof row !== 'object') {
				return {
					id: `${fallbackPrefix}-${index}`,
					label: `${fallbackPrefix} ${index + 1}`
				};
			}

			const record = row as Record<string, unknown>;

			return {
				id: resolveId(record, fallbackPrefix, index),
				label: resolveLabel(record, fallbackPrefix, index),
				valence: normalizeValence(record.valence)
			};
		})
		.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
};

const pickString = (record: Record<string, unknown>, keys: readonly string[]): string | null => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim();
		}
	}

	return null;
};

const fallbackFieldName = (index: number): string => `question_${index + 1}`;

const sanitizeFieldName = (value: string, fallback: string): string => {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');

	if (normalized.length > 0) {
		return normalized;
	}

	const trimmed = value.trim();
	if (trimmed.length > 0) {
		return trimmed.replace(/\s+/g, '_').toLowerCase();
	}

	return fallback;
};

const resolveQuestionId = (record: Record<string, unknown>, fallbackPrefix: string, index: number) => {
	for (const key of QUESTION_ID_KEYS) {
		const value = record[key];
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim();
		}
	}

	return `${fallbackPrefix}-${index}`;
};

const normalizeQuestionRows = (
	rows: unknown[] | null | undefined,
	fallbackPrefix: string
): TemplateQuestion[] => {
	if (!Array.isArray(rows)) {
		return [];
	}

	return rows.map((row, index) => {
		if (!row || typeof row !== 'object') {
			return {
				id: `${fallbackPrefix}-${index}`,
				fieldName: fallbackFieldName(index),
				label: `${fallbackPrefix} ${index + 1}`,
				description: null,
				placeholder: null
			};
		}

		const record = row as Record<string, unknown>;
		const id = resolveQuestionId(record, fallbackPrefix, index);
		const rawName = pickString(record, QUESTION_NAME_KEYS);
		const fieldName =
			rawName && rawName.trim().length > 0
				? sanitizeFieldName(rawName, fallbackFieldName(index))
				: fallbackFieldName(index);
		const label =
			pickString(record, QUESTION_TITLE_KEYS) ?? pickString(record, LABEL_KEYS) ?? `${fallbackPrefix} ${index + 1}`;
		const description = pickString(record, QUESTION_DESCRIPTION_KEYS);
		const placeholder = pickString(record, QUESTION_PLACEHOLDER_KEYS);

		return {
			id,
			fieldName,
			label,
			description,
			placeholder
		};
	});
};

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	if (!supabase) {
		throw error(500, 'Supabase client unavailable');
	}

	const config = templates.find((t) => t.name === params.template);
	if (!config) {
		throw error(404, 'Template not found');
	}

	const templateItems = (Array.isArray(config.template) ? config.template : []) as RawTemplateItem[];

	const needsEmotions = templateItems.some(
		(item) => item.type === 'model' && item.model === 'emotion_mapping'
	);

	const needsAssociations = templateItems.some(
		(item) => item.type === 'model' && item.model === 'association_mapping'
	);

	const questionIds = templateItems
		.filter((item) => item.type === 'question' && typeof item.entity_id === 'string')
		.map((item) => (item.entity_id as string).trim())
		.filter((id) => id.length > 0);

	let emotionRows: unknown[] | null = null;
	if (needsEmotions) {
		const { data, error: emotionsError } = await supabase.from('emotions').select('*');
		if (emotionsError) {
			console.error('Failed to load emotions for template', emotionsError);
			throw error(500, 'Unable to load emotions');
		}
		emotionRows = data;
	}

	let associationRows: unknown[] | null = null;
	if (needsAssociations) {
		const { data, error: associationsError } = await supabase.from('associations').select('*');
		if (associationsError) {
			console.error('Failed to load associations for template', associationsError);
			throw error(500, 'Unable to load associations');
		}
		associationRows = data;
	}

	let questionRows: unknown[] | null = null;
	if (questionIds.length > 0) {
		const { data, error: questionsError } = await supabase
			.from('questions')
			.select('*')
			.in('id', questionIds);
		if (questionsError) {
			console.error('Failed to load questions for template', questionsError);
			throw error(500, 'Unable to load questions');
		}
		questionRows = data;
	}

	const emotionLookups = normalizeEmotionRows(emotionRows, 'emotion');
	const associationLookups = normalizeLookupRows(associationRows, 'association');
	const normalizedQuestions = normalizeQuestionRows(questionRows, 'question');
	const questionIndex = new Map(normalizedQuestions.map((question) => [question.id, question]));

	const questionsById: Record<string, TemplateQuestion> = {};

		questionIds.forEach((id, index) => {
			const question = questionIndex.get(id);
			if (question) {
				questionsById[id] = question;
				return;
			}

			questionsById[id] = {
				id,
				fieldName: fallbackFieldName(index),
				label: `Question ${id}`,
				description: null,
				placeholder: null
			};
		});

	return {
		profileId: user.id,
		config,
		emotions: emotionLookups,
		associations: associationLookups,
		questions: questionsById
	};
};
