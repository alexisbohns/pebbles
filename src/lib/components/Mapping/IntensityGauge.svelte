<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	const dispatch = createEventDispatcher<{
		change: { index: number; value: number };
		focus: { index: number };
		intensityStep: { index: number; delta: number };
		intensityNavigate: { index: number; delta: number };
		intensityReset: { index: number };
		intensityJump: { index: number; target: 'start' | 'end' };
	}>();

	export let label: string;
	export let value: number = 0;
	export let index: number;
	export let focusedIndex: number;
	export let max: number = 3;

	let ref: HTMLDivElement;
	let clampedValue = value;

	const isFocused = () => focusedIndex === index;

	function handleKey(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				dispatch('intensityStep', { index, delta: 1 });
				break;
			case 'ArrowLeft':
				event.preventDefault();
				dispatch('intensityStep', { index, delta: -1 });
				break;
			case 'ArrowDown':
				event.preventDefault();
				dispatch('intensityNavigate', { index, delta: 1 });
				break;
			case 'ArrowUp':
				event.preventDefault();
				dispatch('intensityNavigate', { index, delta: -1 });
				break;
			case 'Backspace':
			case 'Delete':
				event.preventDefault();
				dispatch('intensityReset', { index });
				break;
			case 'Home':
				event.preventDefault();
				dispatch('intensityJump', { index, target: 'start' });
				break;
			case 'End':
				event.preventDefault();
				dispatch('intensityJump', { index, target: 'end' });
				break;
			default:
				break;
		}
	}

	function handleFocus() {
		dispatch('focus', { index });
	}

	onMount(() => {
		if (isFocused()) ref?.focus();
	});

	$: if (ref && isFocused()) {
		ref.focus();
	}

	$: clampedValue = Math.max(0, Math.min(value, max));
</script>

<div
	role="slider"
	aria-label={label}
	aria-valuemin="0"
	aria-valuemax={max}
	aria-valuenow={clampedValue}
	tabindex="0"
	bind:this={ref}
	class="flex items-center gap-2 p-2 border rounded-md cursor-pointer outline-none"
	class:ring-2={isFocused()}
	on:keydown={handleKey}
	on:focus={handleFocus}
>
	<span class="w-24 text-sm font-medium">{label}</span>
	<div class="flex gap-1">
		{#each Array.from({ length: max + 1 }, (_, level) => level) as level (level)}
			<button
				type="button"
				class="w-4 h-4 rounded-full transition-colors"
				class:bg-blue-500={level <= clampedValue}
				class:bg-gray-200={level > clampedValue}
				aria-pressed={level === clampedValue}
				aria-label={`Set intensity to ${level}`}
				tabindex="-1"
				on:click={() => {
					dispatch('focus', { index });
					dispatch('change', { index, value: level });
				}}
			></button>
		{/each}
	</div>
</div>
