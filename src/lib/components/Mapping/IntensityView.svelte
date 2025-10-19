<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import type { MappingIntensityValue, MappingItem } from './types';

	export let items: MappingItem[] = [];
	export let initialValues: MappingIntensityValue[] = [];
	export let containerLabel = 'Intensity controls';

	const dispatch = createEventDispatcher<{ change: MappingIntensityValue[] }>();
	const MIN_INTENSITY = -3;
	const MAX_INTENSITY = 3;

	let allValues = new SvelteMap<string, number>();
	let visibleValues = new SvelteMap<string, number>();
	let visibleIds = new SvelteSet<string>();
	let lastInitialValues: MappingIntensityValue[] = initialValues;

	const clamp = (value: number) =>
		Math.max(MIN_INTENSITY, Math.min(MAX_INTENSITY, Math.round(value)));

	$: if (initialValues !== lastInitialValues) {
		const nextAll = new SvelteMap<string, number>();
		for (const entry of initialValues) {
			nextAll.set(entry.id, clamp(entry.value));
		}
		allValues = nextAll;
		lastInitialValues = initialValues;
	}

	$: visibleIds = new SvelteSet(items.map((item) => item.id));

	$: visibleValues = (() => {
		const next = new SvelteMap<string, number>();
		for (const id of visibleIds) {
			const existing = allValues.get(id);
			if (existing !== undefined) {
				next.set(id, existing);
			}
		}
		return next;
	})();

	$: entries = items.map((item) => ({
		item,
		value: visibleValues.get(item.id) ?? null
	}));

	function emitChange() {
		const payload: MappingIntensityValue[] = Array.from(allValues.entries()).map(([id, value]) => ({
			id,
			kind: 'intensity',
			value
		}));
		dispatch('change', payload);
	}

	function setValue(id: string, value: number | null) {
		const nextAll = new SvelteMap(allValues);
		let changed = false;

		if (value === null) {
			changed = nextAll.delete(id);
		} else {
			const clamped = clamp(value);
			const current = nextAll.get(id);
			if (current !== clamped) {
				nextAll.set(id, clamped);
				changed = true;
			}
		}

		if (!changed) return;

		allValues = nextAll;

		const nextVisible = new SvelteMap(visibleValues);
		if (value === null) {
			if (nextVisible.delete(id)) {
				visibleValues = nextVisible;
			}
		} else if (visibleIds.has(id)) {
			nextVisible.set(id, clamp(value));
			visibleValues = nextVisible;
		}

		emitChange();
	}

	function handleSliderChange(id: string, next: number) {
		if (typeof next !== 'number' || Number.isNaN(next)) return;
		setValue(id, clamp(next));
	}

	function handleReset(id: string) {
		setValue(id, null);
	}
</script>

<div class="space-y-3" role="group" aria-label={containerLabel}>
	{#each entries as { item, value } (item.id)}
		<section class="rounded-lg border px-4 py-3">
			<header class="flex items-center justify-between gap-2 pb-2">
				<span class="font-medium text-sm">{item.label}</span>
				<span class="text-xs tabular-nums text-muted-foreground">
					{value === null ? '—' : value}
				</span>
			</header>
			<div class="space-y-2">
				<Slider
					type="single"
					min={MIN_INTENSITY}
					max={MAX_INTENSITY}
					step={1}
					value={value ?? 0}
					onValueChange={(next) => handleSliderChange(item.id, next)}
				/>
				<div class="flex items-center justify-between text-xs text-muted-foreground">
					<span>{MIN_INTENSITY}</span>
					<span>0</span>
					<span>{MAX_INTENSITY}</span>
				</div>
			</div>
			<div class="flex justify-end pt-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="text-muted-foreground"
				disabled={value === null}
				onclick={() => handleReset(item.id)}
			>
				Reset
			</Button>
			</div>
		</section>
	{/each}
</div>
