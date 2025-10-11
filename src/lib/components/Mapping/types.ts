export type ScaleType = 'selection' | 'intensity' | 'impact';

export interface MappingItem {
	id: string;
	label: string;
	valence?: number; // -1, 0, +1
	icon?: string;
}

export interface MappingValue {
	id: string;
	scale_type: ScaleType;
	value: number;
}
