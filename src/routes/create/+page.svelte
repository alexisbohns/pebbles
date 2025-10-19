<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import Button from '$lib/components/ui/button/button.svelte';

	export let data;
	const templates = data.templates;
</script>

<h1>{$t('create.title')}</h1>
{#each templates as template (template.name)}
	<a
		href={resolve(`/create/${template.name}`)}
		class="bg-card border p-4 rounded-lg mb-4 flex items-center"
	>
		<p class="flex flex-col grow">
			<span>
				{template.label}
			</span>
			<span class="text-sm text-muted-foreground">
				{template.description}
			</span>
		</p>
		<Button>Créer</Button>
	</a>
{/each}
