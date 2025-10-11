<script lang="ts">
	import { t } from '$lib';
	import { entriesStore } from '$lib/stores/entriesStore';
	import Question from '$lib/components/Question.svelte';

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
</script>

<h1>Analyse</h1>

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
