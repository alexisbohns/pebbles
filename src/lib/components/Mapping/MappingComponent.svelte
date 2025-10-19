<script lang="ts">
	import MappingHeader from './MappingHeader.svelte';
	import SelectView from './SelectView.svelte';
	import IntensityView from './IntensityView.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type {
		MappingIntensityValue,
		MappingItem,
		MappingSelectionValue,
		MappingValue
	} from './types';

	export let title: string;
	export let items: MappingItem[] = [];
	export let mode: 'select' | 'intensity' = 'select';
	export let valenceFilter: number | null = null;
	export let initialValues: MappingValue[] = [];
	export let enableFilter = false;
	export let onChange: (values: MappingValue[]) => void = () => {};
	export let translationNamespace: string | null = null;

	let showAll = !enableFilter || valenceFilter === null;
	let manualShowAll: boolean | null = null;
	let lastValenceFilter: number | null = valenceFilter;
	let entryMap = new SvelteMap<string, MappingValue>();
	let selectionValues: MappingSelectionValue[] = [];
	let intensityValues: MappingIntensityValue[] = [];
	let lastInitialValues: MappingValue[] = initialValues;
	let visibleItems: MappingItem[] = items;

	$: if (initialValues !== lastInitialValues) {
		entryMap = new SvelteMap(initialValues.map((value) => [value.id, value]));
		lastInitialValues = initialValues;
	}

	const isSelectionValue = (value: MappingValue): value is MappingSelectionValue =>
		value.kind === 'selection';
	const isIntensityValue = (value: MappingValue): value is MappingIntensityValue =>
		value.kind === 'intensity';

	$: selectionValues = Array.from(entryMap.values()).filter(isSelectionValue);

	$: intensityValues = Array.from(entryMap.values()).filter(isIntensityValue);

	$: {
		if (enableFilter) {
			if (valenceFilter !== lastValenceFilter) {
				lastValenceFilter = valenceFilter;
				manualShowAll = null;
			}

			const baseShowAll = valenceFilter === null;
			showAll = manualShowAll ?? baseShowAll;
		} else {
			showAll = true;
			manualShowAll = null;
			lastValenceFilter = null;
		}
	}

	$: visibleItems = getFilteredItems(showAll ? null : valenceFilter);

	function getFilteredItems(activeFilter: number | null): MappingItem[] {
		if (!enableFilter || activeFilter === null) {
			return items;
		}

		if (activeFilter < 0) {
			return items.filter((item) => item.valence === -1);
		}

		if (activeFilter === 0) {
			return items.filter((item) => item.valence === 0);
		}

		return items.filter((item) => item.valence === 1 || item.valence === 0);
	}

	function emitChange() {
		onChange(Array.from(entryMap.values()));
	}

	function handleSelectChange(values: MappingSelectionValue[]) {
		const map = new SvelteMap(entryMap);
		const incomingIds = new Set(values.map((value) => value.id));
		const visibleIds = new Set(visibleItems.map((item) => item.id));

		for (const [id, entry] of map) {
			if (entry.kind === 'selection' && visibleIds.has(id) && !incomingIds.has(id)) {
				map.delete(id);
			}
		}

		for (const value of values) {
			map.set(value.id, {
				id: value.id,
				kind: 'selection'
			});
		}

		entryMap = map;
		emitChange();
	}

	function handleIntensityChange(values: MappingIntensityValue[]) {
		const map = new SvelteMap(entryMap);
		const incomingIds = new Set(values.map((value) => value.id));

		for (const [id, entry] of map) {
			if (entry.kind === 'intensity' && !incomingIds.has(id)) {
				map.delete(id);
			}
		}

		for (const value of values) {
			map.set(value.id, {
				...value,
				kind: 'intensity'
			});
		}

		entryMap = map;
		emitChange();
	}

	function toggleShowAll() {
		if (!enableFilter) return;
		const baseShowAll = valenceFilter === null;
		const current = manualShowAll ?? baseShowAll;
		manualShowAll = !current;
		showAll = !current;
	}
</script>

<div class="space-y-4">
	<MappingHeader
		{title}
		{mode}
		{showAll}
		canToggleFilter={enableFilter}
		on:toggleMode={(e) => (mode = e.detail)}
		on:toggleFilter={toggleShowAll}
	/>

	{#if mode === 'select'}
		<SelectView
			items={visibleItems}
			initialValues={selectionValues}
			{translationNamespace}
			on:change={(event: CustomEvent<MappingSelectionValue[]>) => handleSelectChange(event.detail)}
		/>
	{:else}
		<IntensityView
			items={visibleItems}
			initialValues={intensityValues}
			containerLabel={`${title} intensity controls`}
			{translationNamespace}
			on:change={(event: CustomEvent<MappingIntensityValue[]>) =>
				handleIntensityChange(event.detail)}
		/>
	{/if}
</div>
