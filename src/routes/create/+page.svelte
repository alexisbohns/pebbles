<script lang="ts">
	import { resolve } from '$app/paths';
	export let data;
	const templates = data.templates;
</script>

<h1>Créer une entrée</h1>

<ul class="template-list">
	{#each templates as template (template.name)}
		<li>
			<a href={resolve(`/create/${template.name}`)}>
				{template.label}
			</a>
		</li>
	{/each}
</ul>
