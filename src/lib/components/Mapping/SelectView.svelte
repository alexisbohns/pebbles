<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Toggle } from '$lib/components/ui/toggle';
	import type { MappingItem, MappingSelectionValue } from './types';

	export let items: MappingItem[] = [];
	export let initialValues: MappingSelectionValue[] = [];

	const dispatch = createEventDispatcher<{ change: MappingSelectionValue[] }>();
	let selected = new SvelteSet<string>();

	$: {
		const allowedIds = new SvelteSet(items.map((item) => item.id));
		const ids = initialValues.filter((value) => allowedIds.has(value.id)).map((value) => value.id);
		selected = new SvelteSet(ids);
	}

	function emitChange() {
		const values: MappingSelectionValue[] = Array.from(selected).map((id) => ({
			id,
			kind: 'selection'
		}));
		dispatch('change', values);
	}

	function updateSelection(id: string, isPressed: boolean) {
		const next = new SvelteSet(selected);
		let changed = false;
		if (next.has(id) && !isPressed) {
			next.delete(id);
			changed = true;
		} else if (!next.has(id) && isPressed) {
			next.add(id);
			changed = true;
		}

		if (!changed) return;

		selected = next;
		emitChange();
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each items as item (item.id)}
		<Toggle
			variant="outline"
			size="sm"
			pressed={selected.has(item.id)}
			onPressedChange={(value) => updateSelection(item.id, value)}
		>
			{item.label}
		</Toggle>
	{/each}
</div>
