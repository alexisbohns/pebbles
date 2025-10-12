export interface MappingItem {
	id: string;
	label: string;
	valence?: number; // -1, 0, +1
	icon?: string;
}

export interface MappingSelectionValue {
	id: string;
	kind: 'selection';
}

export interface MappingIntensityValue {
	id: string;
	kind: 'intensity';
	value: number;
}

export type MappingValue = MappingSelectionValue | MappingIntensityValue;
