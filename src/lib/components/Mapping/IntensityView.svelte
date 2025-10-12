<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
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

	function updateValue(id: string, rawValue: string) {
		if (rawValue.trim() === '') {
			setValue(id, null);
			return;
		}

		const parsed = Number.parseInt(rawValue, 10);
		if (Number.isNaN(parsed)) {
			return;
		}

		const clamped = clamp(parsed);
		setValue(id, clamped);
	}

	function handleInput(id: string, event: Event) {
		const target = event.currentTarget as HTMLInputElement | null;
		if (!target) return;
		updateValue(id, target.value);
	}

	function handleBlur(id: string, event: FocusEvent) {
		const target = event.currentTarget as HTMLInputElement | null;
		if (!target) return;
		const raw = target.value.trim();
		if (raw === '') {
			updateValue(id, '');
			return;
		}
		const parsed = Number.parseInt(raw, 10);
		if (Number.isNaN(parsed)) {
			target.value = '';
			updateValue(id, '');
			return;
		}
		const clamped = clamp(parsed);
		if (clamped !== parsed) {
			target.value = String(clamped);
		}
		updateValue(id, target.value);
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
</script>

<div class="flex flex-col gap-2" role="group" aria-label={containerLabel}>
	{#each entries as { item, value } (item.id)}
		<label class="flex items-center gap-3 text-sm">
			<span class="w-32 shrink-0 font-medium">{item.label}</span>
			<input
				type="number"
				class="w-20 rounded border px-2 py-1"
				min={MIN_INTENSITY}
				max={MAX_INTENSITY}
				step="1"
				value={value ?? ''}
				placeholder="—"
				on:input={(event) => handleInput(item.id, event)}
				on:blur={(event) => handleBlur(item.id, event)}
			/>
		</label>
	{/each}
</div>
