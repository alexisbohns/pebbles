import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type LookupRecord = { id: string; label: string };
type EmotionLookupRecord = LookupRecord & { valence?: number };

const LABEL_KEYS = ['name', 'label', 'title'] as const;

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
): EmotionLookupRecord[] => {
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

export const load: PageServerLoad = async ({ locals }) => {
	const { user, supabase } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: rawEmotions, error: emotionsError } = await supabase.from('emotions').select('*');

	if (emotionsError) {
		console.error('Failed to load emotions', emotionsError);
		throw error(500, 'Unable to load emotions');
	}

	const { data: rawAssociations, error: associationsError } = await supabase
		.from('associations')
		.select('*');

	if (associationsError) {
		console.error('Failed to load associations', associationsError);
		throw error(500, 'Unable to load associations');
	}

	return {
		profileId: user.id,
		emotions: normalizeEmotionRows(rawEmotions, 'emotion'),
		associations: normalizeLookupRows(rawAssociations, 'association')
	};
};
