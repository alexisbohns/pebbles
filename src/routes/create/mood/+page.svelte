<script lang="ts">
	import type { PageData } from './$types';

	type MoodKind = 'dailyMood' | 'momentaryEmotion';

	export let data: PageData;

	const kindOptions: Array<{ value: MoodKind; label: string }> = [
		{ value: 'dailyMood', label: 'Daily Mood' },
		{ value: 'momentaryEmotion', label: 'Momentary Emotion' }
	];

	const valenceOptions = ['-3', '-2', '-1', '0', '1', '2', '3'] as const;

	let kind: MoodKind = 'dailyMood';
	let date = '';
	let time = '';
	let valence = '0';
	let selectedEmotions: string[] = [];
	let selectedAssociations: string[] = [];

	$: if (kind !== 'momentaryEmotion' && time !== '') {
		time = '';
	}

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();
		// Submission wiring will be handled in a follow-up iteration.
	};
</script>

<h1>Mood</h1>

<form on:submit={handleSubmit} class="mood-form" aria-label="Create mood">
	<div class="form-field">
		<label for="kind">Kind</label>
		<select id="kind" name="kind" bind:value={kind}>
			{#each kindOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>

	<div class="form-field">
		<label for="date">Date</label>
		<input id="date" name="date" type="date" bind:value={date} required />
	</div>

	{#if kind === 'momentaryEmotion'}
		<div class="form-field">
			<label for="time">Time</label>
			<input id="time" name="time" type="time" bind:value={time} required />
		</div>
	{/if}

	<div class="form-field">
		<label for="valence">Valence</label>
		<select id="valence" name="valence" bind:value={valence} required>
			{#each valenceOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>

	<fieldset class="form-field">
		<legend>Emotions</legend>
		{#if data.emotions.length === 0}
			<p>No emotions available.</p>
		{:else}
			{#each data.emotions as emotion (emotion.id)}
				<label>
					<input type="checkbox" name="emotions" value={emotion.id} bind:group={selectedEmotions} />
					<span>{emotion.label}</span>
				</label>
			{/each}
		{/if}
	</fieldset>

	<fieldset class="form-field">
		<legend>Associations</legend>
		{#if data.associations.length === 0}
			<p>No associations available.</p>
		{:else}
			{#each data.associations as association (association.id)}
				<label>
					<input
						type="checkbox"
						name="associations"
						value={association.id}
						bind:group={selectedAssociations}
					/>
					<span>{association.label}</span>
				</label>
			{/each}
		{/if}
	</fieldset>

	<button type="submit">Save mood</button>
</form>
