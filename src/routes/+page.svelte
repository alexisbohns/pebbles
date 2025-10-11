<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import { entriesStore } from '$lib/stores/entriesStore';

	$: entries = $entriesStore;

	const goToCreate = () => {
		goto(resolve('/create'));
	};
</script>

<h1>{$t('home.title')}</h1>

<button type="button" on:click={goToCreate}>{$t('form.create') ?? 'Create'}</button>

<h2>{$t('home.history.title')}</h2>
<ul>
	{#each entries as entry (entry.id)}
		<li>
			<strong>{entry.situation}</strong> → {entry.thought}
			<br />
			{entry.emotion} | {entry.behavior} | {entry.alternative}
			<small> ({new Date(entry.date).toLocaleString()})</small>
			<button on:click={() => entriesStore.remove(entry.id)}>🗑</button>
		</li>
	{/each}
</ul>
