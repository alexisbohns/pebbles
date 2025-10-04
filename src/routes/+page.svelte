<script lang="ts">
	import { t } from '$lib';
	import { entriesStore } from '$lib/stores/entriesStore';
	import Question from '$lib/components/Question.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { resolve } from '$app/paths';

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
	<Question
		name="situation"
		question="form.situation.question"
		description="form.situation.description"
		placeholder="form.situation.placeholder"
		bind:value={situation}
	/>
	<Question
		name="thought"
		question="form.thought.question"
		description="form.thought.description"
		placeholder="form.thought.placeholder"
		bind:value={thought}
	/>
	<Question
		name="emotion"
		question="form.emotion.question"
		description="form.emotion.description"
		placeholder="form.emotion.placeholder"
		bind:value={emotion}
	/>
	<Question
		name="behavior"
		question="form.behavior.question"
		description="form.behavior.description"
		placeholder="form.behavior.placeholder"
		bind:value={behavior}
	/>
	<Question
		name="alternative"
		question="form.alternative.question"
		description="form.alternative.description"
		placeholder="form.alternative.placeholder"
		bind:value={alternative}
	/>
	<button type="submit">{$t('form.submit')}</button>
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

<div class="page-footer selectable">
	<nav class="page-footer__links">
		<a href={resolve('/legal')}>{$t('pages.legal.title')}</a>
		<a href={resolve('/privacy')}>{$t('pages.privacy.title')}</a>
		<a href={resolve('/about')}>{$t('pages.about.title')}</a>
	</nav>
	<p>{$t('legal.mention')}</p>
	<a
		href={`https://${$t('legal.external_link').replace(/^https?:\/\//, '')}`}
		target="_blank"
		rel="noopener noreferrer"
		aria-label={$t('legal.external_label')}
		title={$t('legal.external_label')}>{$t('legal.external_label')}</a
	>
	<ThemeToggle />
</div>

<style lang="stylus">
	.page-footer
		display flex
		flex-direction column
		align-items start
		gap .5rem

		font-size .8rem
		color var(--e05)

	.page-footer__links
		display flex
		flex-wrap wrap
		gap .75rem
		font-family var(--f-serif)
		font-size .9rem

		:global(a)
			text-decoration underline
			color inherit
</style>
