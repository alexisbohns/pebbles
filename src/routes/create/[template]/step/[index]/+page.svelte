<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import DatePicker from '$lib/components/ui/date-picker.svelte';
	import TimePicker from '$lib/components/ui/time-picker.svelte';
	import { Slider } from '$lib/components/ui/slider';
	import MappingComponent from '$lib/components/Mapping/MappingComponent.svelte';
	import Question from '$lib/components/Question.svelte';
	import type { MappingItem, MappingValue } from '$lib/components/Mapping/types';
	import type { ActionData, PageData } from './$types';
	import { get } from 'svelte/store';

	const PROPERTY_COLUMN_MAP: Record<string, string> = {
		date: 'occurrence_date',
		time: 'occurrence_time'
	};

	const MIN_VALENCE = -3;
	const MAX_VALENCE = 3;

	let {
		data,
		form
	}: {
		data: PageData;
		form: ActionData | null;
	} = $props();

	const currentItem = data.currentItem ?? null;
	const currentIndex = data.currentIndex;
	const totalSteps = data.totalSteps;
	const previousIndex = currentIndex > 0 ? currentIndex - 1 : null;
	const nextIndex = currentIndex < totalSteps - 1 ? currentIndex + 1 : null;
	const isFirstStep = previousIndex === null;
	const isLastStep = nextIndex === null;

	const eventId = form?.eventId ?? data.eventId ?? null;
	const rawEvent = ((data.eventData ?? {}) as Record<string, unknown>) ?? {};
	const modelDefaults = (data.config?.model_properties ?? {}) as Record<string, unknown>;
	const templateItems = Array.isArray(data.templateItems) ? data.templateItems : [];

	const valenceFieldPresent = templateItems.some(
		(item) => item?.type === 'property' && item.property === 'valence'
	);

	const normalizeString = (value: unknown): string => {
		if (typeof value !== 'string') return '';
		return value.trim();
	};

	const resolvePropertyColumn = (property: string) => PROPERTY_COLUMN_MAP[property] ?? property;

	const clampValence = (value: number): number => {
		if (!Number.isFinite(value)) return 0;
		if (value < MIN_VALENCE) return MIN_VALENCE;
		if (value > MAX_VALENCE) return MAX_VALENCE;
		return Math.round(value);
	};

	const parseValence = (value: unknown): number => {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return clampValence(value);
		}

		if (typeof value === 'string') {
			const parsed = Number.parseInt(value, 10);
			if (!Number.isNaN(parsed)) {
				return clampValence(parsed);
			}
		}

		return 0;
	};

	const deriveValenceFilter = (value: unknown): number | null => {
		const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
		if (Number.isNaN(parsed)) return null;
		if (parsed < 0) return -1;
		if (parsed === 0) return 0;
		return 1;
	};

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

	const resolveQuestionMeta = (id: string) => {
		const meta = data.questions?.[id];
		if (meta) return meta;
		return {
			id,
			fieldName: id,
			label: `Question ${id}`,
			description: null,
			placeholder: null
		};
	};

	const resolveQuestionLabel = (id: string, fallbackLabel: string): string => {
		const translate = get(t);
		const nameKey = `question.${id}.name`;
		const translated = translate(nameKey);
		if (translated !== nameKey) {
			return translated;
		}
		return fallbackLabel || id;
	};

	const resolveStepTitle = (): string => {
		if (!currentItem) return '';
		if (currentItem.type === 'property' && typeof currentItem.property === 'string') {
			return resolvePropertyLabel(currentItem.property);
		}

		if (currentItem.type === 'question' && typeof currentItem.entity_id === 'string') {
			const meta = resolveQuestionMeta(currentItem.entity_id);
			return resolveQuestionLabel(currentItem.entity_id, meta.label);
		}

		if (currentItem.type === 'model') {
			if (currentItem.model === 'emotion_mapping') {
				return get(t)('create.template.section.emotions');
			}
			if (currentItem.model === 'association_mapping') {
				return get(t)('create.template.section.associations');
			}
		}

		return `Step ${currentIndex + 1}`;
	};

	const getEventPropertyValue = (property: string): unknown => {
		const column = resolvePropertyColumn(property);
		return rawEvent[column];
	};

	const resolveDefaultValue = (property: string): unknown => {
		if (currentItem && Object.prototype.hasOwnProperty.call(currentItem, 'default')) {
			return (currentItem as Record<string, unknown>).default;
		}

		if (Object.prototype.hasOwnProperty.call(modelDefaults, property)) {
			return modelDefaults[property];
		}

		return undefined;
	};

	const resolvePropertyInitialValue = (): string => {
		if (!currentItem || currentItem.type !== 'property') {
			return '';
		}

		const propertyKey = typeof currentItem.property === 'string' ? currentItem.property : '';
		if (!propertyKey) return '';

		if (form && 'propertyValue' in form) {
			const value = form.propertyValue;
			if (typeof value === 'string') {
				return value;
			}
		}

		const column = resolvePropertyColumn(propertyKey);
		const eventValue = getEventPropertyValue(propertyKey);

		if (column === 'valence') {
			if (eventValue !== undefined && eventValue !== null) {
				return String(parseValence(eventValue));
			}
			const fallback = resolveDefaultValue(propertyKey);
			return fallback === undefined || fallback === null ? '0' : String(parseValence(fallback));
		}

		if (eventValue !== undefined && eventValue !== null) {
			return String(eventValue);
		}

		const fallback = resolveDefaultValue(propertyKey);
		if (fallback === undefined || fallback === null) {
			return '';
		}

		return String(fallback);
	};

	const resolveQuestionInitialValue = (): string => {
		if (!currentItem || currentItem.type !== 'question') {
			return '';
		}

		if (form && 'questionValue' in form) {
			const value = form.questionValue;
			if (typeof value === 'string') {
				return value;
			}
		}

		const questionId = typeof currentItem.entity_id === 'string' ? currentItem.entity_id : '';
		if (!questionId) return '';

		const responses = Array.isArray((rawEvent as { responses?: unknown[] }).responses)
			? ((rawEvent as { responses?: Array<Record<string, unknown>> }).responses ?? [])
			: [];

		for (const response of responses) {
			const id = normalizeString(response.question_id);
			if (id === questionId) {
				const value = normalizeString(response.value);
				return value;
			}
		}

		return '';
	};

	const parseMappingFormValue = (raw: string | undefined | null): MappingValue[] => {
		if (!raw) return [];

		try {
			const parsed = JSON.parse(raw) as MappingValue[];
			if (!Array.isArray(parsed)) {
				return [];
			}

			const map = new Map<string, MappingValue>();
			for (const entry of parsed) {
				if (!entry || typeof entry !== 'object') continue;
				const id = normalizeString((entry as MappingValue).id);
				const kind = (entry as MappingValue).kind;
				if (!id || (kind !== 'selection' && kind !== 'intensity')) continue;

				if (kind === 'intensity') {
					const value = (entry as MappingValue & { value?: number }).value;
					if (typeof value === 'number' && Number.isFinite(value)) {
						map.set(id, { id, kind: 'intensity', value: clampValence(value) });
						continue;
					}
				}

				map.set(id, { id, kind: 'selection' });
			}

			return Array.from(map.values());
		} catch (err) {
			console.error('Failed to parse mapping form value', err);
			return [];
		}
	};

	const resolveMappingInitialValues = (): MappingValue[] => {
		if (!currentItem || currentItem.type !== 'model') {
			return [];
		}

		if (form && 'mappingValue' in form) {
			const value = form.mappingValue;
			if (typeof value === 'string' && value.length > 0) {
				return parseMappingFormValue(value);
			}
		}

		const targetCollection =
			currentItem.model === 'emotion_mapping'
				? ((rawEvent as { emotions?: unknown[] }).emotions ?? [])
				: ((rawEvent as { associations?: unknown[] }).associations ?? []);

		if (!Array.isArray(targetCollection)) {
			return [];
		}

		const values: MappingValue[] = [];
		for (const entry of targetCollection as Array<Record<string, unknown>>) {
			const id =
				currentItem.model === 'emotion_mapping'
					? normalizeString(entry.emotion_id)
					: normalizeString(entry.association_id);

			if (!id) continue;

			const rawValence = entry.valence;
			const parsedValence =
				rawValence === undefined || rawValence === null ? null : parseValence(rawValence);

			if (parsedValence === null || Number.isNaN(parsedValence)) {
				values.push({ id, kind: 'selection' });
			} else {
				values.push({ id, kind: 'intensity', value: clampValence(parsedValence) });
			}
		}

		return values;
	};

	const stepTitle = resolveStepTitle();

	const propertyInitialValue = resolvePropertyInitialValue();
	let propertyValue = $state(propertyInitialValue);

	const questionInitialValue = resolveQuestionInitialValue();
	let questionValue = $state(questionInitialValue);

	const mappingInitialValues = resolveMappingInitialValues();
	let mappingValues = $state<MappingValue[]>(mappingInitialValues);

	const mappingPayload = $derived.by(() => JSON.stringify(mappingValues));

	const emotionItems: MappingItem[] = (data.emotions ?? []).map(({ id, label, valence }) => ({
		id,
		label,
		valence: typeof valence === 'number' ? valence : undefined
	}));

	const associationItems: MappingItem[] = (data.associations ?? []).map(({ id, label }) => ({
		id,
		label
	}));

	const eventValence = rawEvent ? (rawEvent.valence as unknown) : null;
	const emotionValenceFilter = $derived.by(() =>
		valenceFieldPresent ? deriveValenceFilter(eventValence) : null
	);

	const questionId =
		currentItem && currentItem.type === 'question' && typeof currentItem.entity_id === 'string'
			? currentItem.entity_id
			: null;
	const questionMeta = questionId ? resolveQuestionMeta(questionId) : null;
	const questionDescription = questionId ? questionMeta?.description : null;
	const questionPlaceholder = questionId ? questionMeta?.placeholder : null;

	const propertyKey =
		currentItem && currentItem.type === 'property' && typeof currentItem.property === 'string'
			? currentItem.property
			: null;
</script>

<svelte:head>
	<title>{data.config?.label} — {stepTitle}</title>
</svelte:head>

<section class="space-y-6">
	<div class="space-y-2">
		<a href={resolve('/create')} class="text-sm text-muted-foreground hover:underline">
			{$t('create.step.back_to_templates')}
		</a>
		<h1 class="text-2xl font-semibold">{data.config?.label}</h1>
		<p class="text-sm text-muted-foreground">
			{$t('create.step.progress', { current: currentIndex + 1, total: totalSteps })}
		</p>
		<h2 class="text-xl font-semibold">{stepTitle}</h2>
	</div>

	<form method="post" class="space-y-6">
		<input type="hidden" name="eventId" value={eventId ?? ''} />

		{#if currentItem?.type === 'property' && propertyKey}
			<input type="hidden" name="value" value={propertyValue} />
			<div class="space-y-3 rounded-lg border p-4">
				<Label for={`property-${propertyKey}`} class="text-sm font-medium">
					{resolvePropertyLabel(propertyKey)}
				</Label>

				{#if propertyKey === 'valence'}
					{@const currentValence = parseValence(propertyValue)}
					<div class="space-y-3">
						<div class="flex items-center justify-between text-sm text-muted-foreground">
							<span>Valence range</span>
							<span class="font-semibold text-foreground">
								{currentValence > 0 ? `+${currentValence}` : currentValence}
							</span>
						</div>
						<Slider
							id={`property-${propertyKey}`}
							type="single"
							min={MIN_VALENCE}
							max={MAX_VALENCE}
							step={1}
							value={currentValence}
							onValueChange={(next) => {
								if (typeof next !== 'number' || Number.isNaN(next)) return;
								const clamped = clampValence(next);
								propertyValue = String(clamped);
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
									propertyValue = '0';
								}}
							>
								Reset
							</Button>
						</div>
					</div>
				{:else if propertyKey === 'date'}
					<DatePicker class="w-full" bind:value={propertyValue} placeholderText="Select a date" />
				{:else if propertyKey === 'time'}
					<TimePicker class="w-full" bind:value={propertyValue} placeholderText="Select a time" />
				{:else}
					<Input
						id={`property-${propertyKey}`}
						bind:value={propertyValue}
						required={currentItem.mandatory === true}
					/>
				{/if}
			</div>
		{:else if currentItem?.type === 'question' && questionId}
			<input type="hidden" name="value" value={questionValue} />
			<div class="space-y-3 rounded-lg border p-4">
				<Question
					name={questionMeta?.fieldName ?? questionId}
					question={`question.${questionId}.question`}
					description={questionDescription ? `question.${questionId}.description` : ''}
					placeholder={questionPlaceholder ? `question.${questionId}.placeholder` : ''}
					bind:value={questionValue}
					required={currentItem.mandatory === true}
				/>
			</div>
		{:else if currentItem?.type === 'model' && currentItem.model === 'emotion_mapping'}
			<input type="hidden" name="mapping" value={mappingPayload} />
			<div class="space-y-3 rounded-lg border p-4">
				<h3 class="text-lg font-semibold">{$t('create.template.section.emotions')}</h3>
				{#if emotionItems.length === 0}
					<p class="text-sm text-muted-foreground">
						{$t('create.template.empty.emotions')}
					</p>
				{:else}
					<MappingComponent
						title={$t('create.template.section.emotions')}
						items={emotionItems}
						initialValues={mappingValues}
						valenceFilter={emotionValenceFilter}
						enableFilter={valenceFieldPresent}
						translationNamespace="emotions"
						onChange={(values) => {
							mappingValues = values;
						}}
					/>
				{/if}
			</div>
		{:else if currentItem?.type === 'model' && currentItem.model === 'association_mapping'}
			<input type="hidden" name="mapping" value={mappingPayload} />
			<div class="space-y-3 rounded-lg border p-4">
				<h3 class="text-lg font-semibold">{$t('create.template.section.associations')}</h3>
				{#if associationItems.length === 0}
					<p class="text-sm text-muted-foreground">
						{$t('create.template.empty.associations')}
					</p>
				{:else}
					<MappingComponent
						title={$t('create.template.section.associations')}
						items={associationItems}
						initialValues={mappingValues}
						translationNamespace="associations"
						onChange={(values) => {
							mappingValues = values;
						}}
					/>
				{/if}
			</div>
		{:else}
			<p class="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
				{$t('create.step.unsupported')}
			</p>
		{/if}

		{#if form?.message}
			<p class="text-sm text-destructive">{form.message}</p>
		{/if}

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			{#if !isFirstStep}
				<Button type="submit" variant="outline" name="intent" value="previous">
					{$t('create.step.previous')}
				</Button>
			{:else}
				<span class="text-sm text-muted-foreground">
					{$t('create.step.first_hint')}
				</span>
			{/if}

			<div class="flex gap-2">
				{#if eventId}
					<Button type="submit" variant="ghost" name="intent" value="stay">
						{$t('create.step.save')}
					</Button>
				{/if}
				<Button type="submit" name="intent" value="next">
					{#if isLastStep}
						{$t('create.step.finish')}
					{:else}
						{$t('create.step.next')}
					{/if}
				</Button>
			</div>
		</div>
	</form>
</section>
