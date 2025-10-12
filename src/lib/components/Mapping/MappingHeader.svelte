<!-- src/lib/components/Mapping/MappingHeader.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let title: string = '';
	export let mode: 'select' | 'intensity' = 'select';
	export let showAll = false;
	export let canToggleFilter = false;

	const dispatch = createEventDispatcher<{
		toggleMode: 'select' | 'intensity';
		toggleFilter: void;
	}>();

	function setMode(next: 'select' | 'intensity') {
		if (next !== mode) dispatch('toggleMode', next);
	}

	function toggleFilter() {
		dispatch('toggleFilter');
	}
</script>

<div class="flex items-center justify-between gap-4">
	<h3 class="text-lg font-semibold">{title}</h3>

	<div class="flex items-center gap-2">
		<!-- Switch Sélection / Intensité -->
		<div
			class="inline-flex overflow-hidden rounded-xl border"
			role="tablist"
			aria-label="Mode de saisie"
		>
			<button
				type="button"
				class="px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				class:bg-gray-900={mode === 'select'}
				class:text-white={mode === 'select'}
				class:text-gray-700={mode !== 'select'}
				role="tab"
				aria-selected={mode === 'select'}
				on:click={() => setMode('select')}
			>
				Sélection
			</button>
			<button
				type="button"
				class="px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				class:bg-gray-900={mode === 'intensity'}
				class:text-white={mode === 'intensity'}
				class:text-gray-700={mode !== 'intensity'}
				role="tab"
				aria-selected={mode === 'intensity'}
				on:click={() => setMode('intensity')}
			>
				Intensité
			</button>
		</div>

		{#if canToggleFilter}
			<!-- Bouton filtre valence -->
			<button
				type="button"
				class="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				on:click={toggleFilter}
				aria-pressed={showAll}
				title={showAll ? 'Revenir au filtrage par valence' : 'Afficher toutes les entrées'}
			>
				{#if showAll}Filtrer par valence{/if}
				{#if !showAll}Tout afficher{/if}
			</button>
		{/if}
	</div>
</div>

{#if mode === 'intensity'}
	<p class="mt-2 text-xs text-gray-500">
		Astuce clavier : ↑/↓ pour changer de jauge, ←/→ pour ajuster, Backspace pour réinitialiser.
	</p>
{/if}
