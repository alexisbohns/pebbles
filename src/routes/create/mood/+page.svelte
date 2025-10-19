<script lang="ts">
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import type {
		MappingIntensityValue,
		MappingSelectionValue,
		MappingValue
	} from '$lib/components/Mapping/types';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import TimePicker from '$lib/components/ui/time-picker.svelte';
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

let { data }: { data: PageData } = $props();

	const kindOptions: Array<{ value: EventKind; label: string }> = [
		{ value: 'moment', label: 'Moment' },
		{ value: 'day', label: 'Day' }
	];

	const MIN_VALENCE = -3;
	const MAX_VALENCE = 3;

let kind = $state<EventKind>('day');
let date = $state('');
let time = $state('');
let valence = $state(0);
let emotionValues = $state<MappingValue[]>([]);
let associationValues = $state<MappingValue[]>([]);
const emotionValenceFilter = $derived.by(() => deriveValenceFilter(valence));
const emotionSelectionValues = $derived.by(() => emotionValues.filter(isSelectionValue));
const associationSelectionValues = $derived.by(() => associationValues.filter(isSelectionValue));
const emotionSelectionIds = $derived.by(() => emotionSelectionValues.map((value) => value.id));
const associationSelectionIds = $derived.by(() => associationSelectionValues.map((value) => value.id));
const emotionIntensityValues = $derived.by(() => emotionValues.filter(isIntensityValue));
const associationIntensityValues = $derived.by(() => associationValues.filter(isIntensityValue));
let submissionPreview = $state<string | null>(null);
let submitError = $state<string | null>(null);
let submitSuccessId = $state<string | null>(null);
let isSubmitting = $state(false);
	const INDENT = '  ';

	$effect(() => {
		if (kind !== 'moment' && time !== '') {
			time = '';
		}
	});
	const isSelectionValue = (value: MappingValue): value is MappingSelectionValue =>
		value.kind === 'selection';
	const isIntensityValue = (value: MappingValue): value is MappingIntensityValue =>
		value.kind === 'intensity';

	function deriveValenceFilter(input: number): number | null {
		if (!Number.isFinite(input)) return null;
		if (input < 0) return -1;
		if (input === 0) return 0;
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
		return {
			p_kind: kind,
			p_valence: Number.isFinite(valence) ? Math.round(valence) : 0,
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

function updateValence(next: number) {
    if (typeof next !== 'number' || Number.isNaN(next)) return;
    const clamped = Math.max(MIN_VALENCE, Math.min(MAX_VALENCE, Math.round(next)));
    if (valence !== clamped) {
        valence = clamped;
    }
}

	const formattedValence = $derived.by(() => (valence > 0 ? `+${valence}` : String(valence)));
</script>

<h1 class="text-2xl font-semibold tracking-tight">Event</h1>

<form
	onsubmit={handleSubmit}
	class="space-y-6"
	aria-label="Create event"
>
	<div class="grid gap-2">
		<Label for="kind">Kind</Label>
		<select
			id="kind"
			name="kind"
			bind:value={kind}
			class="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
		>
			{#each kindOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>

	<div class="grid gap-2">
		<Label>Date</Label>
		<DatePicker bind:value={date} placeholderText="Select a date" class="w-full" />
	</div>

	{#if kind === 'moment'}
		<div class="grid gap-2">
			<Label>Time</Label>
			<TimePicker bind:value={time} placeholderText="Select a time" />
		</div>
	{/if}

	<div class="grid gap-3">
		<div class="flex items-center justify-between gap-3">
			<Label class="text-base font-semibold" for="valence">
				Valence
			</Label>
			<span class="text-sm text-muted-foreground">{formattedValence}</span>
		</div>
		<Slider
			id="valence"
			type="single"
			min={MIN_VALENCE}
			max={MAX_VALENCE}
			step={1}
			value={valence}
			onValueChange={updateValence}
		/>
		<div class="flex items-center justify-between text-xs text-muted-foreground">
			<span>{MIN_VALENCE}</span>
			<span>0</span>
			<span>+{Math.abs(MAX_VALENCE)}</span>
		</div>
	</div>

	<div class="space-y-4 rounded-lg border p-4">
		{#if data.emotions.length === 0}
			<p class="text-sm text-muted-foreground">No emotions available.</p>
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

	<div class="space-y-4 rounded-lg border p-4">
		{#if data.associations.length === 0}
			<p class="text-sm text-muted-foreground">No associations available.</p>
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

	<Button
		type="submit"
		disabled={isSubmitting}
		class="w-full sm:w-auto"
	>
		{#if isSubmitting}
			Saving…
		{:else}
			Save event
		{/if}
	</Button>

	{#if submitError}
		<p class="text-sm text-destructive" role="alert">{submitError}</p>
	{:else if submitSuccessId}
		<p class="text-sm text-emerald-600" role="status">
			Event saved successfully (id: {submitSuccessId}).
		</p>
	{/if}
</form>

{#if submissionPreview}
	<section class="mt-8 space-y-3 rounded-lg border p-4" aria-live="polite">
		<h2 class="text-lg font-semibold">RPC payload preview</h2>
		<pre class="overflow-x-auto rounded-md bg-muted/20 p-4 text-sm leading-relaxed">
			<code class="language-ts">{submissionPreview}</code>
		</pre>
	</section>
{/if}
