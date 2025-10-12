<script lang="ts">
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import type {
		MappingIntensityValue,
		MappingSelectionValue,
		MappingValue
	} from '$lib/components/Mapping/types';
	import { SvelteMap } from 'svelte/reactivity';
	import type { PageData } from './$types';

	type EventKind = 'moment' | 'day';
	type EmotionPayload = {
		emotion_id: string;
		valence?: number | null;
	};
	type AssociationPayload = {
		association_id: string;
		valence?: number | null;
	};
	type RpcArgs = {
		p_kind: EventKind;
		p_valence: number;
		p_occurrence_date: string;
		p_occurrence_time: string | null;
		p_name: string;
		p_description: string;
		p_emotions: EmotionPayload[];
		p_associations: AssociationPayload[];
	};

	export let data: PageData;

	const kindOptions: Array<{ value: EventKind; label: string }> = [
		{ value: 'moment', label: 'Moment' },
		{ value: 'day', label: 'Day' }
	];

	const valenceOptions = ['-3', '-2', '-1', '0', '1', '2', '3'] as const;
	type ValenceOption = (typeof valenceOptions)[number];

	let kind: EventKind = 'day';
	let date = '';
	let time = '';
	let valence: ValenceOption = '0';
	let emotionValues: MappingValue[] = [];
	let associationValues: MappingValue[] = [];
	let emotionValenceFilter: number | null = null;
	let emotionSelectionValues: MappingSelectionValue[] = [];
	let associationSelectionValues: MappingSelectionValue[] = [];
	let emotionSelectionIds: string[] = [];
	let associationSelectionIds: string[] = [];
	let emotionIntensityValues: MappingIntensityValue[] = [];
	let associationIntensityValues: MappingIntensityValue[] = [];
	let submissionPreview: string | null = null;
	let submitError: string | null = null;
	let submitSuccessId: string | null = null;
	let isSubmitting = false;
	const INDENT = '  ';

	$: if (kind !== 'moment' && time !== '') {
		time = '';
	}

	$: emotionValenceFilter = deriveValenceFilter(valence);
	const isSelectionValue = (value: MappingValue): value is MappingSelectionValue =>
		value.kind === 'selection';
	const isIntensityValue = (value: MappingValue): value is MappingIntensityValue =>
		value.kind === 'intensity';

	$: emotionSelectionValues = emotionValues.filter(isSelectionValue);
	$: associationSelectionValues = associationValues.filter(isSelectionValue);
	$: emotionSelectionIds = emotionSelectionValues.map((value) => value.id);
	$: associationSelectionIds = associationSelectionValues.map((value) => value.id);
	$: emotionIntensityValues = emotionValues.filter(isIntensityValue);
	$: associationIntensityValues = associationValues.filter(isIntensityValue);

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

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		submitError = null;
		submitSuccessId = null;
		if (!date) {
			submitError = 'Date is required.';
			submissionPreview = null;
			return;
		}
		if (kind === 'moment' && !time) {
			submitError = 'Time is required for moments.';
			submissionPreview = null;
			return;
		}
		const rpcArgs = buildRpcArgs();
		const formattedArgs = indentLines(formatLiteral(rpcArgs), 1);
		const snippetBase = ["await supabase.rpc('upsert_event_full',", formattedArgs, ');'];
		submissionPreview = snippetBase.join('\n');
		isSubmitting = true;
		try {
			const response = await fetch('/api/events', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(rpcArgs)
			});

			if (!response.ok) {
				let message = `Failed to save event (status ${response.status})`;
				try {
					const problem = await response.json();
					if (problem?.message) {
						message = problem.message;
					}
				} catch {
					// ignore JSON parsing failures
				}
				throw new Error(message);
			}

			const payload: { id?: string } = await response.json();
			const eventId = payload?.id ?? null;
			submitSuccessId = eventId;
			submissionPreview = [
				...snippetBase,
				eventId ? `// → event id: '${eventId}'` : '// → event saved'
			].join('\n');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unexpected error while saving event';
			submitError = message;
			submissionPreview = [...snippetBase, `// ! error: ${message}`].join('\n');
		} finally {
			isSubmitting = false;
		}
	};

	function dedupeValues(values: MappingValue[]): MappingValue[] {
		const map = new SvelteMap<string, MappingValue>();
		for (const value of values) {
			map.set(value.id, value);
		}
		return Array.from(map.values());
	}

	function buildEmotionPayload(values: MappingValue[]): EmotionPayload[] {
		return dedupeValues(values).map((entry) =>
			entry.kind === 'intensity'
				? { emotion_id: entry.id, valence: entry.value }
				: { emotion_id: entry.id }
		);
	}

	function buildAssociationPayload(values: MappingValue[]): AssociationPayload[] {
		return dedupeValues(values).map((entry) =>
			entry.kind === 'intensity'
				? { association_id: entry.id, valence: entry.value }
				: { association_id: entry.id }
		);
	}

	function buildRpcArgs(): RpcArgs {
		const parsedValence = Number.parseInt(valence, 10);
		return {
			p_kind: kind,
			p_valence: Number.isNaN(parsedValence) ? 0 : parsedValence,
			p_occurrence_date: date,
			p_occurrence_time: kind === 'moment' ? time || null : null,
			p_name: '',
			p_description: '',
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

<h1>Event</h1>

<form on:submit={handleSubmit} class="mood-form" aria-label="Create event">
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

	{#if kind === 'moment'}
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

	<button type="submit" disabled={isSubmitting}>
		{#if isSubmitting}
			Saving…
		{:else}
			Save event
		{/if}
	</button>

	{#if submitError}
		<p class="text-sm text-red-600 mt-2" role="alert">{submitError}</p>
	{:else if submitSuccessId}
		<p class="text-sm text-emerald-600 mt-2" role="status">
			Event saved successfully (id: {submitSuccessId}).
		</p>
	{/if}
</form>

{#if submissionPreview}
	<section class="mood-preview" aria-live="polite">
		<h2>RPC payload preview</h2>
		<pre><code class="language-ts">{submissionPreview}</code></pre>
	</section>
{/if}
