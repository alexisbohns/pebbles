<script lang="ts">
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import Question from '$lib/components/Question.svelte';
	import type { MappingItem, MappingValue } from '$lib/components/Mapping/types';
	import { t } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import TimePicker from '$lib/components/ui/time-picker.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { get } from 'svelte/store';
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

let { data }: { data: PageData } = $props();

	const { config, emotions, associations, questions } = data;
	const rawTemplateItems = (Array.isArray(config.template) ? config.template : []) as Array<
		Record<string, unknown> | null | undefined
	>;

const propertyItems: PropertyItem[] = [];
const questionItems: QuestionItem[] = [];
let hasEmotionMapping = $state(false);
let hasAssociationMapping = $state(false);

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

let propertyValues = $state<Record<string, string>>({ ...initialPropertyValues });

	const initialQuestionValues = questionItems.reduce<Record<string, string>>((acc, item) => {
		acc[item.id] = '';
		return acc;
	}, {});

let questionValues = $state<Record<string, string>>({ ...initialQuestionValues });

let emotionValues = $state<MappingValue[]>([]);
let associationValues = $state<MappingValue[]>([]);

const MIN_VALENCE = -3;
const MAX_VALENCE = 3;
const valenceFieldPresent = propertyItems.some((item) => item.key === 'valence');
const valenceValue = $derived.by(() => propertyValues.valence ?? '');
const emotionValenceFilter = $derived.by(() =>
	valenceFieldPresent ? deriveValenceFilter(valenceValue) : null
);

let submissionPreview = $state<string | null>(null);
let submitError = $state<string | null>(null);
let submitSuccessMessage = $state<string | null>(null);
let isSubmitting = $state(false);
const INDENT = '  ';

	const eventKind =
		typeof modelDefaults.kind === 'string' && modelDefaults.kind.trim().length > 0
			? modelDefaults.kind
			: 'moment';

	function deriveValenceFilter(input: string | number): number | null {
		const parsed = typeof input === 'number' ? input : Number.parseInt(input, 10);
		if (Number.isNaN(parsed)) return null;
		if (parsed < 0) return -1;
		if (parsed === 0) return 0;
		return 1;
	}

	function formatPropertyLabel(property: string): string {
		if (!property) return '';
		return property.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
	}

	const propertyLabelKey = (key: string) => `create.template.fields.${key}`;

	function resolvePropertyLabel(key: string): string {
		const translate = get(t);
		const labelKey = propertyLabelKey(key);
		const translated = translate(labelKey);
		return translated === labelKey ? formatPropertyLabel(key) : translated;
	}

	function resolveQuestionLabel(id: string, fallbackIndex: number, fallbackLabel: string): string {
		const translate = get(t);
		const nameKey = `question.${id}.name`;
		const translated = translate(nameKey);
		if (translated !== nameKey) {
			return translated;
		}

		return fallbackLabel || `Question ${fallbackIndex + 1}`;
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
		return Math.max(MIN_VALENCE, Math.min(MAX_VALENCE, value));
	}

	function parseValence(value: string | number | undefined): number {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return clampValence(value);
		}

	if (value === undefined) {
		const candidate = modelDefaults.valence;
		if (typeof candidate === 'number') {
			return clampValence(candidate);
		}
	}

	const raw = typeof value === 'string' ? value : '';
	const parsed = Number.parseInt(raw, 10);
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
		const translate = get(t);

		for (const item of propertyItems) {
			if (!item.mandatory) continue;
			const value = (propertyValues[item.key] ?? '').trim();
			if (value.length === 0) {
				const label = resolvePropertyLabel(item.key);
				return translate('create.template.error.field_required', { field: label });
			}
		}

		for (let index = 0; index < questionItems.length; index += 1) {
			const item = questionItems[index];
			if (!item.mandatory) continue;
			const value = (questionValues[item.id] ?? '').trim();
			if (value.length === 0) {
				const meta = resolveQuestionMeta(item.id, index);
				const label = resolveQuestionLabel(item.id, index, meta.label);
				return translate('create.template.error.field_required', { field: label });
			}
		}

		const rpcArgs = buildRpcArgs();
		if (!rpcArgs.p_occurrence_date) {
			const label = resolvePropertyLabel('date');
			return translate('create.template.error.field_required', { field: label });
		}

		if (eventKind === 'moment') {
			const timeItem = propertyItems.find((item) => item.key === 'time');
			if (timeItem?.mandatory && !rpcArgs.p_occurrence_time) {
				const label = resolvePropertyLabel('time');
				return translate('create.template.error.field_required', { field: label });
			}
		}

		return null;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitError = null;
		submitSuccessMessage = null;

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

		const translate = get(t);

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
				let message = translate('create.template.error.save_status', { status: response.status });
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
			const successKey = eventId
				? 'create.template.success.with_id'
				: 'create.template.success.default';
			submitSuccessMessage = eventId
				? translate(successKey, { id: eventId })
				: translate(successKey);

			submissionPreview = [
				...snippetBase,
				eventId ? `// → event id: '${eventId}'` : '// → event saved'
			].join('\n');
		} catch (err) {
			const fallbackMessage = translate('create.template.error.unexpected');
			const message = err instanceof Error && err.message ? err.message : fallbackMessage;
			submitError = message;
			submissionPreview = [...snippetBase, `// ! error: ${message}`].join('\n');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<h1 class="text-2xl font-semibold tracking-tight">{config.label}</h1>

<form class="template-form space-y-8" onsubmit={handleSubmit}>
	{#if propertyItems.length > 0}
		<section
			class="form-section space-y-4 rounded-lg border p-4"
			aria-label={$t('create.template.section.details')}
		>
			{#each propertyItems as item (item.key)}
				{@const label = resolvePropertyLabel(item.key)}
				{@const fieldId = `property-${item.key}`}
				<div class="space-y-2">
					<Label for={fieldId} class="font-medium">{label}</Label>
					{#if item.key === 'valence'}
						{@const currentValence = parseValence(propertyValues[item.key])}
						<div class="space-y-3">
							<div class="flex items-center justify-between text-sm text-muted-foreground">
								<span>Valence range</span>
								<span class="font-semibold text-foreground">
									{currentValence > 0 ? `+${currentValence}` : currentValence}
								</span>
							</div>
							<Slider
								id={fieldId}
								type="single"
								min={MIN_VALENCE}
								max={MAX_VALENCE}
								step={1}
								value={currentValence}
								onValueChange={(next) => {
									if (typeof next !== 'number' || Number.isNaN(next)) return;
									const clamped = Math.max(
										MIN_VALENCE,
										Math.min(MAX_VALENCE, Math.round(next))
									);
									propertyValues = {
										...propertyValues,
										[item.key]: String(clamped)
									};
								}}
							/>
							<div class="flex items-center justify-between text-xs text-muted-foreground">
								<span>{MIN_VALENCE}</span>
								<span>0</span>
								<span>+{Math.abs(MAX_VALENCE)}</span>
							</div>
							<div class="flex justify-end pt-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="text-muted-foreground"
					onclick={() => {
						propertyValues = { ...propertyValues, [item.key]: '0' };
					}}
				>
									Reset
								</Button>
							</div>
						</div>
					{:else if item.key === 'date'}
						<DatePicker
							class="w-full"
							bind:value={propertyValues[item.key]}
							placeholderText="Select a date"
						/>
					{:else if item.key === 'time'}
						<TimePicker
							class="w-full"
							bind:value={propertyValues[item.key]}
							placeholderText="Select a time"
						/>
					{:else}
						<Input
							id={fieldId}
							bind:value={propertyValues[item.key]}
							required={item.mandatory}
						/>
					{/if}
				</div>
			{/each}
		</section>
	{/if}

	{#if hasEmotionMapping}
		<section
			class="form-section space-y-4 rounded-lg border p-4"
			aria-label={$t('create.template.section.emotions')}
		>
			<h2 class="text-lg font-semibold">{$t('create.template.section.emotions')}</h2>
			{#if emotions.length === 0}
				<p class="text-sm text-muted-foreground">
					{$t('create.template.empty.emotions')}
				</p>
			{:else}
				<MappingComponent
					title={$t('create.template.section.emotions')}
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
		<section
			class="form-section space-y-4 rounded-lg border p-4"
			aria-label={$t('create.template.section.associations')}
		>
			<h2 class="text-lg font-semibold">{$t('create.template.section.associations')}</h2>
			{#if associations.length === 0}
				<p class="text-sm text-muted-foreground">
					{$t('create.template.empty.associations')}
				</p>
			{:else}
				<MappingComponent
					title={$t('create.template.section.associations')}
					items={associationItems}
					initialValues={associationValues}
					onChange={handleAssociationChange}
				/>
			{/if}
		</section>
	{/if}

	{#if questionItems.length > 0}
		<section
			class="form-section space-y-4 rounded-lg border p-4"
			aria-label={$t('create.template.section.questions')}
		>
			<h2 class="text-lg font-semibold">{$t('create.template.section.questions')}</h2>
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

	<Button type="submit" disabled={isSubmitting} class="w-full sm:w-auto">
		{#if isSubmitting}
			{$t('create.template.button.saving')}
		{:else}
			{$t('create.template.button.save')}
		{/if}
	</Button>

	{#if submitError}
		<p class="text-sm text-destructive" role="alert">{submitError}</p>
	{:else if submitSuccessMessage}
		<p class="text-sm text-emerald-600" role="status">{submitSuccessMessage}</p>
	{/if}
</form>

{#if submissionPreview}
	<section
		class="template-preview mt-8 space-y-3 rounded-lg border p-4"
		aria-live="polite"
	>
		<h2 class="text-lg font-semibold">{$t('create.template.preview.title')}</h2>
		<pre class="overflow-x-auto rounded-md bg-muted/20 p-4 text-sm leading-relaxed">
			<code class="language-ts">{submissionPreview}</code>
		</pre>
	</section>
{/if}
