<script lang="ts">
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import type { MappingValue } from '$lib/components/Mapping/types';
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
	let emotionValues: MappingValue[] = [];
	let associationValues: MappingValue[] = [];
	let emotionValenceFilter: number | null = null;
	let emotionSelectionIds: string[] = [];
	let associationSelectionIds: string[] = [];
	let emotionIntensityValues: MappingValue[] = [];
	let associationIntensityValues: MappingValue[] = [];

	$: if (kind !== 'momentaryEmotion' && time !== '') {
		time = '';
	}

	$: emotionValenceFilter = deriveValenceFilter(valence);
	$: emotionSelectionIds = emotionValues
		.filter((value) => value.scale_type === 'selection')
		.map((value) => value.id);
	$: associationSelectionIds = associationValues
		.filter((value) => value.scale_type === 'selection')
		.map((value) => value.id);
	$: emotionIntensityValues = emotionValues.filter((value) => value.scale_type === 'intensity');
	$: associationIntensityValues = associationValues.filter(
		(value) => value.scale_type === 'intensity'
	);

	function deriveValenceFilter(input: string): number | null {
		const parsed = Number.parseInt(input, 10);
		if (Number.isNaN(parsed)) return null;
		if (parsed < 0) return -1;
		if (parsed === 0) return 0;
		return 1;
	}

	const handleEmotionChange = (values: MappingValue[]) => {
		emotionValues = values;
	};

	const handleAssociationChange = (values: MappingValue[]) => {
		associationValues = values;
	};

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

	<div class="form-field">
		{#if data.emotions.length === 0}
			<p>No emotions available.</p>
		{:else}
			<MappingComponent
				title="Emotions"
				items={data.emotions}
				initialValues={emotionValues}
				valenceFilter={emotionValenceFilter}
				enableFilter={true}
				onChange={handleEmotionChange}
			/>
		{/if}
	</div>

	{#each emotionSelectionIds as id (id)}
		<input type="hidden" name="emotions" value={id} />
	{/each}

	{#each emotionIntensityValues as entry (entry.id)}
		<input type="hidden" name="emotionIntensities" value={`${entry.id}:${entry.value}`} />
	{/each}

	<div class="form-field">
		{#if data.associations.length === 0}
			<p>No associations available.</p>
		{:else}
			<MappingComponent
				title="Associations"
				items={data.associations}
				initialValues={associationValues}
				onChange={handleAssociationChange}
			/>
		{/if}
	</div>

	{#each associationSelectionIds as id (id)}
		<input type="hidden" name="associations" value={id} />
	{/each}

	{#each associationIntensityValues as entry (entry.id)}
		<input type="hidden" name="associationIntensities" value={`${entry.id}:${entry.value}`} />
	{/each}

	<button type="submit">Save mood</button>
</form>
