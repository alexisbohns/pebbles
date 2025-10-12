<script lang="ts">
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import Question from '$lib/components/Question.svelte';
	import type { MappingItem, MappingValue } from '$lib/components/Mapping/types';
	import { SvelteMap } from 'svelte/reactivity';
	import type { PageData } from './$types';

	type PropertyItem = {
		key: string;
		mandatory: boolean;
		defaultValue?: unknown;
	};

	type QuestionItem = {
		id: string;
		mandatory: boolean;
	};

	type TemplateQuestionMeta = {
		id: string;
		fieldName: string;
		label: string;
		description: string | null;
		placeholder: string | null;
	};

	export let data: PageData;

	const { config, emotions, associations, questions } = data;
	const rawTemplateItems = (Array.isArray(config.template) ? config.template : []) as Array<
		Record<string, unknown> | null | undefined
	>;

	const propertyItems: PropertyItem[] = [];
	const questionItems: QuestionItem[] = [];
	let hasEmotionMapping = false;
	let hasAssociationMapping = false;

	for (const rawItem of rawTemplateItems) {
		if (!rawItem || typeof rawItem !== 'object') continue;
		const record = rawItem as Record<string, unknown>;
		const type = typeof record.type === 'string' ? record.type : null;

		if (type === 'property' && typeof record.property === 'string') {
			propertyItems.push({
				key: record.property,
				mandatory: typeof record.mandatory === 'boolean' ? record.mandatory : false,
				defaultValue: record.default
			});
			continue;
		}

		if (type === 'question' && typeof record.entity_id === 'string') {
			questionItems.push({
				id: record.entity_id,
				mandatory: typeof record.mandatory === 'boolean' ? record.mandatory : false
			});
			continue;
		}

		if (type === 'model' && typeof record.model === 'string') {
			if (record.model === 'emotion_mapping') {
				hasEmotionMapping = true;
			} else if (record.model === 'association_mapping') {
				hasAssociationMapping = true;
			}
		}
	}

	const emotionItems: MappingItem[] = emotions.map(({ id, label, valence }) => ({
		id,
		label,
		valence: typeof valence === 'number' ? valence : undefined
	}));

	const associationItems: MappingItem[] = associations.map(({ id, label }) => ({
		id,
		label
	}));

	const modelDefaults = (config.model_properties ?? {}) as Record<string, unknown>;

	const initialPropertyValues = propertyItems.reduce(
		(acc, item) => {
			const key = item.key;
			const candidate =
				item.defaultValue ??
				(Object.prototype.hasOwnProperty.call(modelDefaults, key) ? modelDefaults[key] : undefined);

			if (candidate === undefined || candidate === null) {
				acc[key] = '';
			} else {
				acc[key] = String(candidate);
			}

			return acc;
		},
		{} as Record<string, string>
	);

	if (
		propertyItems.some((item) => item.key === 'valence') &&
		!('valence' in initialPropertyValues)
	) {
		const candidate = modelDefaults.valence;
		initialPropertyValues.valence =
			candidate === undefined || candidate === null ? '0' : String(candidate);
	}

	let propertyValues: Record<string, string> = { ...initialPropertyValues };

	for (const item of propertyItems) {
		if (!(item.key in propertyValues)) {
			propertyValues[item.key] = '';
		}
	}

	const initialQuestionValues = questionItems.reduce<Record<string, string>>((acc, item) => {
		acc[item.id] = '';
		return acc;
	}, {});

	let questionValues: Record<string, string> = { ...initialQuestionValues };

	let emotionValues: MappingValue[] = [];
	let associationValues: MappingValue[] = [];

	const valenceOptions = ['-3', '-2', '-1', '0', '1', '2', '3'] as const;
	const valenceFieldPresent = propertyItems.some((item) => item.key === 'valence');

	let submissionPreview: string | null = null;
	let submitError: string | null = null;
	let submitSuccessId: string | null = null;
	let isSubmitting = false;
	const INDENT = '  ';

	$: valenceValue = propertyValues.valence ?? '';
	$: emotionValenceFilter = valenceFieldPresent ? deriveValenceFilter(valenceValue) : null;

	const eventKind =
		typeof modelDefaults.kind === 'string' && modelDefaults.kind.trim().length > 0
			? modelDefaults.kind
			: 'moment';

	function deriveValenceFilter(input: string): number | null {
		const parsed = Number.parseInt(input, 10);
		if (Number.isNaN(parsed)) return null;
		if (parsed < 0) return -1;
		if (parsed === 0) return 0;
		return 1;
	}

	function formatPropertyLabel(property: string): string {
		if (!property) return '';
		return property.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
	}

	function buildFieldNameFromId(id: string, fallbackIndex: number): string {
		const normalized = id
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '');

		if (normalized.length > 0) {
			return normalized;
		}

		return `question_${fallbackIndex + 1}`;
	}

	function resolveQuestionMeta(id: string, fallbackIndex: number): TemplateQuestionMeta {
		const fallback: TemplateQuestionMeta = {
			id,
			fieldName: buildFieldNameFromId(id, fallbackIndex),
			label: `Question ${id}`,
			description: null,
			placeholder: null
		};

		return questions?.[id] ?? fallback;
	}

	function handleEmotionChange(values: MappingValue[]) {
		emotionValues = values;
	}

	function handleAssociationChange(values: MappingValue[]) {
		associationValues = values;
	}

	function clampValence(value: number): number {
		return Math.max(-3, Math.min(3, value));
	}

	function parseValence(value: string | undefined): number {
		if (value === undefined) {
			const candidate = modelDefaults.valence;
			if (typeof candidate === 'number') {
				return clampValence(candidate);
			}
		}

		const parsed = Number.parseInt(value ?? '', 10);
		if (Number.isNaN(parsed)) {
			return 0;
		}
		return clampValence(parsed);
	}

	function dedupeValues(values: MappingValue[]): MappingValue[] {
		const map = new SvelteMap<string, MappingValue>();
		for (const value of values) {
			map.set(value.id, value);
		}
		return Array.from(map.values());
	}

	function buildEmotionPayload(values: MappingValue[]) {
		return dedupeValues(values).map((entry) =>
			entry.kind === 'intensity'
				? { emotion_id: entry.id, valence: entry.value }
				: { emotion_id: entry.id }
		);
	}

	function buildAssociationPayload(values: MappingValue[]) {
		return dedupeValues(values).map((entry) =>
			entry.kind === 'intensity'
				? { association_id: entry.id, valence: entry.value }
				: { association_id: entry.id }
		);
	}

	function buildResponsePayload(values: Record<string, string>) {
		return Object.entries(values)
			.map(([id, rawValue]) => ({
				question_id: id,
				value: (rawValue ?? '').trim()
			}))
			.filter((entry) => entry.value.length > 0);
	}

	function buildRpcArgs() {
		const dateValue = (propertyValues.date ?? '').trim();
		const timeValue = (propertyValues.time ?? '').trim();
		const nameDefault = typeof modelDefaults.name === 'string' ? modelDefaults.name.trim() : '';
		const descriptionDefault =
			typeof modelDefaults.description === 'string' ? modelDefaults.description.trim() : '';

		const nameValue = (propertyValues.name ?? nameDefault).trim();
		const descriptionValue = (propertyValues.description ?? descriptionDefault).trim();

		return {
			p_kind: eventKind,
			p_valence: parseValence(propertyValues.valence),
			p_occurrence_date: dateValue,
			p_occurrence_time: eventKind === 'moment' ? timeValue || null : null,
			p_name: nameValue,
			p_description: descriptionValue,
			p_emotions: buildEmotionPayload(emotionValues),
			p_associations: buildAssociationPayload(associationValues),
			p_responses: buildResponsePayload(questionValues)
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

	function validateForm(): string | null {
		for (const item of propertyItems) {
			if (!item.mandatory) continue;
			const value = (propertyValues[item.key] ?? '').trim();
			if (value.length === 0) {
				return `${formatPropertyLabel(item.key)} is required.`;
			}
		}

		for (let index = 0; index < questionItems.length; index += 1) {
			const item = questionItems[index];
			if (!item.mandatory) continue;
			const value = (questionValues[item.id] ?? '').trim();
			if (value.length === 0) {
				const meta = resolveQuestionMeta(item.id, index);
				return `Please answer "${meta.label}".`;
			}
		}

		const rpcArgs = buildRpcArgs();
		if (!rpcArgs.p_occurrence_date) {
			return 'Date is required.';
		}

		if (eventKind === 'moment') {
			const timeItem = propertyItems.find((item) => item.key === 'time');
			if (timeItem?.mandatory && !rpcArgs.p_occurrence_time) {
				return 'Time is required for this template.';
			}
		}

		return null;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitError = null;
		submitSuccessId = null;

		const validationError = validateForm();
		if (validationError) {
			submitError = validationError;
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

			const payload: { id?: string | null } = await response.json();
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
	}
</script>

<h1>{config.label}</h1>

<form class="template-form" on:submit|preventDefault={handleSubmit}>
	{#if propertyItems.length > 0}
		<section class="form-section" aria-label="Event details">
			{#each propertyItems as item (item.key)}
				<div class="form-field">
					<label for={`property-${item.key}`}>{formatPropertyLabel(item.key)}</label>
					{#if item.key === 'valence'}
						<select
							id={`property-${item.key}`}
							bind:value={propertyValues[item.key]}
							required={item.mandatory}
						>
							{#each valenceOptions as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					{:else}
						<input
							id={`property-${item.key}`}
							type={item.key === 'date'
								? 'date'
								: item.key === 'time'
									? 'time'
									: item.key === 'valence'
										? 'number'
										: 'text'}
							bind:value={propertyValues[item.key]}
							required={item.mandatory}
						/>
					{/if}
				</div>
			{/each}
		</section>
	{/if}

	{#if hasEmotionMapping}
		<section class="form-section" aria-label="Emotions">
			<h2>Emotions</h2>
			{#if emotions.length === 0}
				<p>No emotions available.</p>
			{:else}
				<MappingComponent
					title="Emotions"
					items={emotionItems}
					initialValues={emotionValues}
					valenceFilter={emotionValenceFilter}
					enableFilter={valenceFieldPresent}
					onChange={handleEmotionChange}
				/>
			{/if}
		</section>
	{/if}

	{#if hasAssociationMapping}
		<section class="form-section" aria-label="Associations">
			<h2>Associations</h2>
			{#if associations.length === 0}
				<p>No associations available.</p>
			{:else}
				<MappingComponent
					title="Associations"
					items={associationItems}
					initialValues={associationValues}
					onChange={handleAssociationChange}
				/>
			{/if}
		</section>
	{/if}

	{#if questionItems.length > 0}
		<section class="form-section" aria-label="Questions">
			<h2>Questions</h2>
			{#each questionItems as item, index (item.id)}
				{@const meta = resolveQuestionMeta(item.id, index)}
				<Question
					name={meta.fieldName}
					question={`question.${meta.id}.question`}
					description={`question.${meta.id}.description`}
					placeholder={`question.${meta.id}.placeholder`}
					bind:value={questionValues[item.id]}
					required={item.mandatory}
				/>
			{/each}
		</section>
	{/if}

	<button type="submit" disabled={isSubmitting}>
		{#if isSubmitting}
			Saving…
		{:else}
			Save event
		{/if}
	</button>

	{#if submitError}
		<p class="form-message error" role="alert">{submitError}</p>
	{:else if submitSuccessId}
		<p class="form-message success" role="status">
			Event saved successfully{submitSuccessId ? ` (id: ${submitSuccessId})` : ''}.
		</p>
	{/if}
</form>

{#if submissionPreview}
	<section class="template-preview" aria-live="polite">
		<h2>RPC payload preview</h2>
		<pre><code class="language-ts">{submissionPreview}</code></pre>
	</section>
{/if}

<style lang="stylus">
	.template-form
		display flex
		flex-direction column
		gap 2rem
		margin-top 1.5rem

	.form-section
		display flex
		flex-direction column
		gap 1rem

	.form-field
		display flex
		flex-direction column
		gap 0.5rem

		label
			font-weight 600

		input, select
			padding 0.5rem
			border 1px solid var(--e05)
			border-radius 0.5rem
			font-size 1rem
			background-color transparent
			color var(--e10)

		input:focus, select:focus
			outline 2px solid var(--a05)
			outline-offset 2px

	button
		align-self flex-start
		padding 0.75rem 1.5rem
		border none
		border-radius 2rem
		background-color var(--a05)
		color var(--e10)
		font-size 1rem
		cursor pointer
		transition background-color 0.2s ease

	button[disabled]
		cursor progress
		opacity 0.7

	.form-message
		font-size 0.95rem

	.form-message.error
		color var(--r05)

	.form-message.success
		color var(--g05)

	.template-preview
		margin-top 2rem
		display flex
		flex-direction column
		gap 1rem

		pre
			background-color rgba(255, 255, 255, 0.04)
			padding 1rem
			border-radius 0.75rem
			overflow auto
</style>
