<script lang="ts">
	import { t } from '$lib';
	import { entriesStore } from '$lib/stores/entriesStore';

	let situation = '';
	let thought = '';
	let emotion = '';
	let behavior = '';
	let alternative = '';

	const addEntry = () => {
		if (!situation || !thought) return;
		entriesStore.add({ situation, thought, emotion, behavior, alternative });
		situation = thought = emotion = behavior = alternative = '';
	};

	$: entries = $entriesStore;
</script>

<h1>{$t('home.title')}</h1>

<form on:submit|preventDefault={addEntry}>
	<input placeholder={$t('home.form.situation')} bind:value={situation} />
	<input placeholder={$t('home.form.thought')} bind:value={thought} />
	<input placeholder={$t('home.form.emotion')} bind:value={emotion} />
	<input placeholder={$t('home.form.behavior')} bind:value={behavior} />
	<input placeholder={$t('home.form.alternative')} bind:value={alternative} />
	<button type="submit">{$t('home.form.submit')}</button>
</form>

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
