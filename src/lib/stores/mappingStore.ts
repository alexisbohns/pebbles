import { writable } from 'svelte/store';
import type { MappingValue } from '$lib/components/Mapping/types';

export const mappingValues = writable<MappingValue[]>([]);
