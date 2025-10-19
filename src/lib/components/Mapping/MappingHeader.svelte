<!-- src/lib/components/Mapping/MappingHeader.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import {
		TooltipProvider,
		Tooltip,
		TooltipTrigger,
		TooltipContent
	} from '$lib/components/ui/tooltip';
	import MousePointerClick from '@lucide/svelte/icons/mouse-pointer-click';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';

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
	<div class="flex items-center gap-2">
		<!-- Switch Sélection / Intensité -->
		<TooltipProvider>
			<ToggleGroup
				type="single"
				value={mode}
				onValueChange={(value) => {
					if (value === 'select' || value === 'intensity') {
						setMode(value);
					}
				}}
				aria-label="Mode de saisie"
			>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<ToggleGroupItem {...props} value="select" aria-label="Sélection">
								<MousePointerClick />
							</ToggleGroupItem>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>Sélection</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<ToggleGroupItem {...props} value="intensity" aria-label="Intensité">
								<SlidersHorizontal />
							</ToggleGroupItem>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>Intensité</TooltipContent>
				</Tooltip>
			</ToggleGroup>
		</TooltipProvider>

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
		Astuce clavier&nbsp;: Tab pour naviguer, ↑/↓ pour ajuster, Suppr pour effacer.
	</p>
{/if}
