<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import IntensityGauge from './IntensityGauge.svelte';
	import type { MappingItem, MappingValue } from './types';

	export let items: MappingItem[] = [];
	export let initialValues: MappingValue[] = [];
	export let maxLevel = 3;
	export let containerLabel = 'Intensity controls';

	const dispatch = createEventDispatcher<{ change: MappingValue[] }>();
	let focusedIndex = 0;
	let allValues = new SvelteMap<string, number>();
	let visibleValues = new SvelteMap<string, number>();
	let visibleIds = new SvelteSet<string>();
	let lastInitialValues: MappingValue[] = initialValues;

	$: if (initialValues !== lastInitialValues) {
		allValues = new SvelteMap(initialValues.map(({ id, value }) => [id, value]));
		lastInitialValues = initialValues;
	}

	$: {
		visibleIds = new SvelteSet(items.map((item) => item.id));
		const nextVisible = new SvelteMap<string, number>();
		for (const id of visibleIds) {
			const existing = allValues.get(id);
			if (existing !== undefined) {
				nextVisible.set(id, existing);
			}
		}
		visibleValues = nextVisible;
	}

	$: {
		if (items.length === 0) {
			focusedIndex = 0;
		} else if (focusedIndex > items.length - 1) {
			focusedIndex = items.length - 1;
		} else if (focusedIndex < 0) {
			focusedIndex = 0;
		}
	}

	function emitChange() {
		const payload: MappingValue[] = Array.from(allValues.entries()).map(([id, value]) => ({
			id,
			scale_type: 'intensity',
			value
		}));
		dispatch('change', payload);
	}

	function setValue(id: string, value: number) {
		const nextAll = new SvelteMap(allValues);
		nextAll.set(id, value);
		allValues = nextAll;

		if (visibleIds.has(id)) {
			const nextVisible = new SvelteMap(visibleValues);
			nextVisible.set(id, value);
			visibleValues = nextVisible;
		}

		emitChange();
	}

	function adjustValueById(id: string, delta: number) {
		const current = allValues.get(id) ?? 0;
		const next = Math.max(0, Math.min(maxLevel, current + delta));
		if (next === current) return;
		setValue(id, next);
	}

	function resetValueById(id: string) {
		const current = allValues.get(id) ?? 0;
		if (current === 0) return;
		setValue(id, 0);
	}

	function handleFocusRequest(index: number) {
		if (items.length === 0) return;
		const clamped = Math.max(0, Math.min(index, items.length - 1));
		focusedIndex = clamped;
	}

	function handleGaugeChange(id: string, value: number) {
		const clamped = Math.max(0, Math.min(maxLevel, value));
		setValue(id, clamped);
	}

	function handleStep(index: number, id: string, delta: number) {
		focusedIndex = index;
		adjustValueById(id, delta);
	}

	function handleReset(index: number, id: string) {
		focusedIndex = index;
		resetValueById(id);
	}

	function handleNavigate(index: number, delta: number) {
		focusedIndex = index;
		handleFocusRequest(index + delta);
	}

	function handleJump(index: number, target: 'start' | 'end') {
		focusedIndex = index;
		if (items.length === 0) return;
		handleFocusRequest(target === 'start' ? 0 : items.length - 1);
	}
</script>

<div class="flex flex-col gap-2" role="group" aria-label={containerLabel}>
	{#each items as item, i (item.id)}
		<IntensityGauge
			label={item.label}
			value={visibleValues.get(item.id) ?? 0}
			index={i}
			{focusedIndex}
			max={maxLevel}
			on:change={(event: CustomEvent<{ index: number; value: number }>) =>
				handleGaugeChange(item.id, event.detail.value)}
			on:intensityStep={(event: CustomEvent<{ index: number; delta: number }>) =>
				handleStep(event.detail.index, item.id, event.detail.delta)}
			on:intensityReset={(event: CustomEvent<{ index: number }>) =>
				handleReset(event.detail.index, item.id)}
			on:intensityNavigate={(event: CustomEvent<{ index: number; delta: number }>) =>
				handleNavigate(event.detail.index, event.detail.delta)}
			on:intensityJump={(event: CustomEvent<{ index: number; target: 'start' | 'end' }>) =>
				handleJump(event.detail.index, event.detail.target)}
			on:focus={(event: CustomEvent<{ index: number }>) => handleFocusRequest(event.detail.index)}
		/>
	{/each}
</div>
