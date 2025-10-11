import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type LookupRecord = { id: string; label: string };

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
			const rawId = record.id ?? record.uuid ?? record.slug ?? index;
			const candidates = ['name', 'label', 'title'] as const;
			let resolvedLabel: string | null = null;

			for (const key of candidates) {
				const value = record[key];
				if (typeof value === 'string' && value.trim().length > 0) {
					resolvedLabel = value.trim();
					break;
				}
			}

			return {
				id: String(rawId),
				label: resolvedLabel ?? `${fallbackPrefix} ${index + 1}`
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
		emotions: normalizeLookupRows(rawEmotions, 'emotion'),
		associations: normalizeLookupRows(rawAssociations, 'association')
	};
};
