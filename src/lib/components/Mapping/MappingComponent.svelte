<script lang="ts">
	import MappingHeader from './MappingHeader.svelte';
	import SelectView from './SelectView.svelte';
	import IntensityView from './IntensityView.svelte';
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
	let selectionValues: MappingValue[] = [];
	let intensityValues: MappingValue[] = [];
	let lastInitialValues: MappingValue[] = initialValues;
	let visibleItems: MappingItem[] = items;

	$: if (initialValues !== lastInitialValues) {
		selectionValues = initialValues.filter((value) => value.scale_type === 'selection');
		intensityValues = initialValues.filter((value) => value.scale_type === 'intensity');
		lastInitialValues = initialValues;
	}

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
		onChange([...selectionValues, ...intensityValues]);
	}

	function handleSelectChange(values: MappingValue[]) {
		const visibleIds = new Set(visibleItems.map((item) => item.id));
		const preserved = selectionValues.filter((value) => !visibleIds.has(value.id));
		const next: MappingValue[] = [...preserved];

		for (const value of values) {
			const existingIndex = next.findIndex((entry) => entry.id === value.id);
			if (existingIndex !== -1) {
				next[existingIndex] = value;
			} else {
				next.push(value);
			}
		}

		selectionValues = next;
		emitChange();
	}

	function handleIntensityChange(values: MappingValue[]) {
		intensityValues = values;
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
