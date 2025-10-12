<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';

	export let data;
	const templates = data.templates;
</script>

<h1>{$t('create.title')}</h1>

<ul class="template-list">
	{#each templates as template (template.name)}
		<li>
			<a href={resolve(`/create/${template.name}`)}>
				{template.label}
			</a>
		</li>
	{/each}
</ul>
