<script lang="ts">
	import MappingHeader from './MappingHeader.svelte';
	import SelectView from './SelectView.svelte';
	import IntensityView from './IntensityView.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { MappingItem, MappingValue } from './types';

	export let title: string;
	export let items: MappingItem[] = [];
	export let mode: 'select' | 'intensity' = 'select';
	export let valenceFilter: number | null = null;
	export let initialValues: MappingValue[] = [];
	export let enableFilter = false;
	export let onChange: (values: MappingValue[]) => void = () => {};

	let showAll = !enableFilter || valenceFilter === null;
	let manualShowAll: boolean | null = null;
	let lastValenceFilter: number | null = valenceFilter;
	let entryMap = new SvelteMap<string, MappingValue>();
	let selectionValues: MappingValue[] = [];
	let intensityValues: MappingValue[] = [];
	let lastInitialValues: MappingValue[] = initialValues;
	let visibleItems: MappingItem[] = items;

	$: if (initialValues !== lastInitialValues) {
		entryMap = new SvelteMap(initialValues.map((value) => [value.id, value]));
		lastInitialValues = initialValues;
	}

	$: selectionValues = Array.from(entryMap.values()).filter(
		(value) => value.scale_type === 'selection'
	);

	$: intensityValues = Array.from(entryMap.values()).filter(
		(value) => value.scale_type === 'intensity'
	);

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

	function handleSelectChange(values: MappingValue[]) {
		const map = new SvelteMap(entryMap);
		const incomingIds = new Set(values.map((value) => value.id));
		const visibleIds = new Set(visibleItems.map((item) => item.id));

		for (const [id, entry] of map) {
			if (entry.scale_type === 'selection' && visibleIds.has(id) && !incomingIds.has(id)) {
				map.delete(id);
			}
		}

		for (const value of values) {
			map.set(value.id, {
				...value,
				scale_type: 'selection'
			});
		}

		entryMap = map;
		emitChange();
	}

	function handleIntensityChange(values: MappingValue[]) {
		const map = new SvelteMap(entryMap);
		const incomingIds = new Set(values.map((value) => value.id));

		for (const [id, entry] of map) {
			if (entry.scale_type === 'intensity' && !incomingIds.has(id)) {
				map.delete(id);
			}
		}

		for (const value of values) {
			map.set(value.id, {
				...value,
				scale_type: 'intensity'
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
			on:change={(event: CustomEvent<MappingValue[]>) => handleSelectChange(event.detail)}
		/>
	{:else}
		<IntensityView
			items={visibleItems}
			initialValues={intensityValues}
			containerLabel={`${title} intensity controls`}
			on:change={(event: CustomEvent<MappingValue[]>) => handleIntensityChange(event.detail)}
		/>
	{/if}
</div>
