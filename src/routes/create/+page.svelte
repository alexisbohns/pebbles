<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import Button from '$lib/components/ui/button/button.svelte';

	export let data;
	const templates = data.templates;
</script>

<h1>{$t('create.title')}</h1>
{#each templates as template (template.name)}
	<div class="bg-card border p-4 rounded-lg mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
		<div class="flex grow flex-col">
			<span>
				{template.label}
			</span>
			<span class="text-sm text-muted-foreground">
				{template.description}
			</span>
		</div>
		<div class="flex flex-shrink-0 gap-2">
			<Button href={resolve(`/create/${template.name}`)}>Créer</Button>
			<Button variant="outline" href={resolve(`/create/${template.name}/step/0`)}>Pas à pas</Button>
		</div>
	</div>
{/each}
