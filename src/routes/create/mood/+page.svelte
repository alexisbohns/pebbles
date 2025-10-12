<script lang="ts">
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import type { MappingValue } from '$lib/components/Mapping/types';
	import type { PageData } from './$types';

	type MoodKind = 'dailyMood' | 'momentaryEmotion';
	type EmotionPayload = {
		emotion_id: string;
		scale_type: MappingValue['scale_type'];
		value: number;
	};
	type AssociationPayload = {
		association_id: string;
		scale_type: MappingValue['scale_type'];
		value: number;
	};
	type RpcArgs = {
		p_profile_id: string;
		p_kind: string;
		p_valence: string;
		p_emotions: EmotionPayload[];
		p_associations: AssociationPayload[];
	};

	export let data: PageData;

	const kindOptions: Array<{ value: MoodKind; label: string }> = [
		{ value: 'dailyMood', label: 'Daily Mood' },
		{ value: 'momentaryEmotion', label: 'Momentary Emotion' }
	];

	const valenceOptions = ['-3', '-2', '-1', '0', '1', '2', '3'] as const;
	type ValenceOption = (typeof valenceOptions)[number];
	const valenceScale: Record<ValenceOption, string> = {
		'-3': 'veryUnpleasant',
		'-2': 'unpleasant',
		'-1': 'slightlyUnpleasant',
		'0': 'neutral',
		'1': 'slightlyPleasant',
		'2': 'pleasant',
		'3': 'veryPleasant'
	};

	let kind: MoodKind = 'dailyMood';
	let date = '';
	let time = '';
	let valence: ValenceOption = '0';
	let emotionValues: MappingValue[] = [];
	let associationValues: MappingValue[] = [];
	let emotionValenceFilter: number | null = null;
	let emotionSelectionIds: string[] = [];
	let associationSelectionIds: string[] = [];
	let emotionIntensityValues: MappingValue[] = [];
	let associationIntensityValues: MappingValue[] = [];
	let submissionPreview: string | null = null;
	const PROFILE_PLACEHOLDER = 'PROFILE_ID_FROM_SESSION';
	const INDENT = '  ';

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
		const rpcArgs = buildRpcArgs();
		const formattedArgs = indentLines(formatLiteral(rpcArgs), 1);
		submissionPreview = ["await supabase.rpc('upsert_mood_full',", formattedArgs, ');'].join('\n');
	};

	function buildEmotionPayload(values: MappingValue[]): EmotionPayload[] {
		return values.map(({ id, scale_type, value }) => ({
			emotion_id: id,
			scale_type,
			value
		}));
	}

	function buildAssociationPayload(values: MappingValue[]): AssociationPayload[] {
		return values.map(({ id, scale_type, value }) => ({
			association_id: id,
			scale_type,
			value
		}));
	}

	function buildRpcArgs(): RpcArgs {
		const profileId = data.profileId ?? PROFILE_PLACEHOLDER;
		return {
			p_profile_id: profileId,
			p_kind: kind,
			p_valence: valenceScale[valence] ?? valence,
			p_emotions: buildEmotionPayload(emotionValues),
			p_associations: buildAssociationPayload(associationValues)
		};
	}

	function formatLiteral(value: unknown, depth = 0): string {
		if (Array.isArray(value)) {
			if (value.length === 0) return '[]';
			const entries = value
				.map((item) => `${INDENT.repeat(depth + 1)}${formatLiteral(item, depth + 1)}`)
				.join(',\n');
			return `[\n${entries}\n${INDENT.repeat(depth)}]`;
		}

		if (value && typeof value === 'object') {
			const entries = Object.entries(value as Record<string, unknown>);
			if (entries.length === 0) return '{}';
			const lines = entries
				.map(([key, val]) => `${INDENT.repeat(depth + 1)}${key}: ${formatLiteral(val, depth + 1)}`)
				.join(',\n');
			return `{\n${lines}\n${INDENT.repeat(depth)}}`;
		}

		if (typeof value === 'string') {
			return `'${value.replace(/'/g, "\\'")}'`;
		}

		if (value === null) {
			return 'null';
		}

		if (value === undefined) {
			return 'undefined';
		}

		return String(value);
	}

	function indentLines(text: string, depth: number): string {
		const prefix = INDENT.repeat(depth);
		return text
			.split('\n')
			.map((line) => `${prefix}${line}`)
			.join('\n');
	}
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

{#if submissionPreview}
	<section class="mood-preview" aria-live="polite">
		<h2>RPC payload preview</h2>
		<pre><code class="language-ts">{submissionPreview}</code></pre>
	</section>
{/if}
