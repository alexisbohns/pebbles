type EmotionPayload = {
	emotion_id: string;
	valence?: number;
};

type AssociationPayload = {
	association_id: string;
	valence?: number;
};

type ResponsePayload = {
	question_id: string;
	value: string;
};

export const clampValence = (value: number): number => {
	if (!Number.isFinite(value)) return 0;
	return Math.max(-3, Math.min(3, Math.round(value)));
};

export const normalizeEventValence = (value: unknown): number => {
	if (typeof value === 'number') {
		return clampValence(value);
	}

	if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isNaN(parsed)) {
			return clampValence(parsed);
		}
	}

	return 0;
};

export const normalizeOptionalValence = (value: unknown): number | undefined => {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'number') {
		return clampValence(value);
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isNaN(parsed)) {
			return clampValence(parsed);
		}
	}
	return undefined;
};

export const normalizeText = (value: unknown): string => {
	if (typeof value !== 'string') return '';
	return value.trim();
};

export const normalizeKind = (value: unknown): string => {
	if (value === 'moment' || value === 'day') {
		return value;
	}
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'day';
};

export const normalizeTime = (value: unknown): string | null => {
	if (value === null || value === undefined || value === '') {
		return null;
	}
	if (typeof value === 'string') {
		return value;
	}
	return null;
};

export const normalizeEmotionCollection = (
	items: EmotionPayload[] | undefined
): EmotionPayload[] => {
	if (!Array.isArray(items)) return [];
	const map = new Map<string, EmotionPayload>();

	for (const item of items) {
		if (!item || typeof item !== 'object') continue;
		const emotionId = String((item as EmotionPayload).emotion_id ?? '').trim();
		if (!emotionId) continue;

		const normalized: EmotionPayload = {
			emotion_id: emotionId
		};

		const valence = normalizeOptionalValence((item as EmotionPayload).valence);
		if (valence !== undefined) {
			normalized.valence = valence;
		}

		map.set(emotionId, normalized);
	}

	return Array.from(map.values());
};

export const normalizeAssociationCollection = (
	items: AssociationPayload[] | undefined
): AssociationPayload[] => {
	if (!Array.isArray(items)) return [];
	const map = new Map<string, AssociationPayload>();

	for (const item of items) {
		if (!item || typeof item !== 'object') continue;
		const associationId = String((item as AssociationPayload).association_id ?? '').trim();
		if (!associationId) continue;

		const normalized: AssociationPayload = {
			association_id: associationId
		};

		const valence = normalizeOptionalValence((item as AssociationPayload).valence);
		if (valence !== undefined) {
			normalized.valence = valence;
		}

		map.set(associationId, normalized);
	}

	return Array.from(map.values());
};

export const normalizeResponseCollection = (
	items: ResponsePayload[] | undefined
): ResponsePayload[] => {
	if (!Array.isArray(items)) return [];
	const map = new Map<string, ResponsePayload>();

	for (const item of items) {
		if (!item || typeof item !== 'object') continue;
		const questionId = String((item as ResponsePayload).question_id ?? '').trim();
		if (!questionId) continue;

		const normalizedValue = normalizeText((item as ResponsePayload).value);
		if (normalizedValue.length === 0) continue;

		map.set(questionId, {
			question_id: questionId,
			value: normalizedValue
		});
	}

	return Array.from(map.values());
};
