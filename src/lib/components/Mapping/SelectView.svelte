<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MappingItem, MappingValue } from './types';

	export let items: MappingItem[] = [];
	export let initialValues: MappingValue[] = [];

	const dispatch = createEventDispatcher<{ change: MappingValue[] }>();
	let selected = new Set<string>();

	$: {
		const allowedIds = new Set(items.map((item) => item.id));
		const ids = initialValues.filter((value) => allowedIds.has(value.id)).map((value) => value.id);
		selected = new Set(ids);
	}

	function emitChange() {
		const values: MappingValue[] = Array.from(selected).map((id) => ({
			id,
			scale_type: 'selection',
			value: 1
		}));
		dispatch('change', values);
	}

	function toggle(id: string) {
		const next = new Set(selected);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selected = next;
		emitChange();
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each items as item}
		<button
			type="button"
			class="px-3 py-1 rounded-full border transition"
			class:bg-blue-500={selected.has(item.id)}
			class:text-white={selected.has(item.id)}
			class:bg-gray-100={!selected.has(item.id)}
			aria-pressed={selected.has(item.id)}
			on:click={() => toggle(item.id)}
		>
			{item.label}
		</button>
	{/each}
</div>
