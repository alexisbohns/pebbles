<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib';
	import type { PageData } from './$types';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '$lib/components/ui/button';

	type RawEmotion = {
		emotion_id?: string | null;
		valence?: number | string | null;
	};

	type RawAssociation = {
		association_id?: string | null;
		valence?: number | string | null;
	};

	type RawResponse = {
		question_id?: string | null;
		value?: string | null;
	};

	let { data }: { data: PageData } = $props();
	const event = $derived.by(() => data.event);
	const previousEventId = $derived.by(() => {
		const value = typeof data?.previousEventId === 'string' ? data.previousEventId.trim() : '';
		return value.length > 0 ? value : null;
	});
	const nextEventId = $derived.by(() => {
		const value = typeof data?.nextEventId === 'string' ? data.nextEventId.trim() : '';
		return value.length > 0 ? value : null;
	});

	const parseValence = (value: unknown): number | null => {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string') {
			const parsed = Number.parseInt(value, 10);
			if (!Number.isNaN(parsed)) return parsed;
		}
		return null;
	};

	const formatDateOnly = (value: unknown, localeValue?: string): string | null => {
		if (typeof value !== 'string') return null;
		const trimmed = value.trim();
		if (trimmed.length === 0) return null;

		const resolvedLocale = localeValue && localeValue.length > 0 ? localeValue : 'en';
		const parsed = new Date(trimmed);
		if (!Number.isNaN(parsed.getTime())) {
			try {
				return new Intl.DateTimeFormat(resolvedLocale, { dateStyle: 'medium' }).format(parsed);
			} catch {
				return trimmed;
			}
		}

		return trimmed;
	};

	const formatTimeOnly = (value: unknown, localeValue?: string): string | null => {
		if (typeof value !== 'string') return null;
		const trimmed = value.trim();
		if (trimmed.length === 0) return null;

		const resolvedLocale = localeValue && localeValue.length > 0 ? localeValue : 'en';
		const isoTime = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
		const parsed = new Date(`1970-01-01T${isoTime}`);

		if (!Number.isNaN(parsed.getTime())) {
			try {
				return new Intl.DateTimeFormat(resolvedLocale, { timeStyle: 'short' }).format(parsed);
			} catch {
				return trimmed.slice(0, 5);
			}
		}

		return trimmed;
	};

	const formatDateTime = (value: unknown, localeValue?: string): string | null => {
		if (typeof value !== 'string') return null;
		const trimmed = value.trim();
		if (trimmed.length === 0) return null;

		const resolvedLocale = localeValue && localeValue.length > 0 ? localeValue : 'en';
		const parsed = new Date(trimmed);
		if (!Number.isNaN(parsed.getTime())) {
			try {
				return new Intl.DateTimeFormat(resolvedLocale, {
					dateStyle: 'medium',
					timeStyle: 'short'
				}).format(parsed);
			} catch {
				return trimmed;
			}
		}

		return trimmed;
	};

	const kindLabel = $derived.by(() => {
		const kind = typeof event?.kind === 'string' ? event.kind.trim() : '';
		return kind.length > 0 ? $t('events.detail.kind_title', { kind }) : null;
	});
	const title = $derived.by(() => {
		const name = typeof event?.name === 'string' ? event.name.trim() : '';
		if (name.length > 0) return name;

		return kindLabel ?? $t('events.detail.title_fallback');
	});
	const backLabel = $derived($t('events.detail.back_to_list'));
	const previousLabel = $derived($t('events.detail.previous_event'));
	const nextLabel = $derived($t('events.detail.next_event'));
	const currentLocale = $derived($locale);
	const previousHref = $derived.by(() =>
		previousEventId ? resolve('/events/[id]', { id: previousEventId }) : null
	);
	const nextHref = $derived.by(() =>
		nextEventId ? resolve('/events/[id]', { id: nextEventId }) : null
	);
	const occurrenceDate = $derived.by(() => formatDateOnly(event?.occurrence_date, currentLocale));
	const occurrenceTime = $derived.by(() => formatTimeOnly(event?.occurrence_time, currentLocale));
	const createdAt = $derived.by(() => formatDateTime(event?.created_at, currentLocale));
	const updatedAt = $derived.by(() => formatDateTime(event?.updated_at, currentLocale));
	const valence = $derived.by(() => parseValence(event?.valence));
	const description = $derived.by(() => {
		const text = typeof event?.description === 'string' ? event.description.trim() : '';
		return text.length > 0 ? text : null;
	});
	const emptyValue = $derived($t('events.detail.empty_value'));

	const emotions = $derived.by(() => {
		const rawEmotions = ((event ?? {}) as { emotions?: RawEmotion[] }).emotions;
		if (!Array.isArray(rawEmotions)) return [];
		return rawEmotions
			.map((item) => {
				if (!item || typeof item !== 'object') return null;
				const id = typeof item.emotion_id === 'string' ? item.emotion_id.trim() : '';
				if (id.length === 0) return null;

				let label = $t(`emotions.${id}`);
				if (label === `emotions.${id}`) {
					label = id;
				}

				return {
					id,
					label,
					valence: parseValence(item.valence)
				};
			})
			.filter(Boolean) as Array<{ id: string; label: string; valence: number | null }>;
	});

	const associations = $derived.by(() => {
		const rawAssociations = ((event ?? {}) as { associations?: RawAssociation[] }).associations;
		if (!Array.isArray(rawAssociations)) return [];
		return rawAssociations
			.map((item) => {
				if (!item || typeof item !== 'object') return null;
				const id = typeof item.association_id === 'string' ? item.association_id.trim() : '';
				if (id.length === 0) return null;

				let label = $t(`associations.${id}`);
				if (label === `associations.${id}`) {
					label = id;
				}

				return {
					id,
					label,
					valence: parseValence(item.valence)
				};
			})
			.filter(Boolean) as Array<{ id: string; label: string; valence: number | null }>;
	});

	const responses = $derived.by(() => {
		const rawResponses = ((event ?? {}) as { responses?: RawResponse[] }).responses;
		if (!Array.isArray(rawResponses)) return [];
		return rawResponses
			.map((item) => {
				if (!item || typeof item !== 'object') return null;
				const id = typeof item.question_id === 'string' ? item.question_id.trim() : '';
				const value = typeof item.value === 'string' ? item.value.trim() : '';
				if (id.length === 0 || value.length === 0) return null;

				let label = $t(`question.${id}.name`);
				if (label === `question.${id}.name`) {
					label = id;
				}

				return {
					id,
					label,
					value
				};
			})
			.filter(Boolean) as Array<{ id: string; label: string; value: string }>;
	});
</script>

<nav class="mb-6 flex justify-between items-center">
	<a class="text-sm text-primary hover:underline" href={resolve('/')}>{backLabel}</a>
	<div class="flex gap-2">
		<Button
			variant="secondary"
			size="icon"
			class="size-8"
			href={previousHref ?? undefined}
			disabled={!previousHref}
			aria-label={previousLabel}
		>
			<ArrowLeft />
		</Button>
		<Button
			variant="secondary"
			size="icon"
			class="size-8"
			href={nextHref ?? undefined}
			disabled={!nextHref}
			aria-label={nextLabel}
		>
			<ArrowRight />
		</Button>
	</div>
</nav>

<section class="space-y-8">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
		{#if kindLabel}
			<p class="text-sm text-muted-foreground">{kindLabel}</p>
		{/if}
		{#if description}
			<p class="text-base text-muted-foreground">{description}</p>
		{/if}
	</header>

	<div class="space-y-4">
		<h2 class="text-lg font-semibold">{$t('events.detail.sections.details')}</h2>
		<dl class="grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg border border-border bg-background/50 p-4">
				<dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{$t('events.detail.fields.occurrence_date')}
				</dt>
				<dd class="mt-1 text-base font-medium">{occurrenceDate ?? emptyValue}</dd>
			</div>
			<div class="rounded-lg border border-border bg-background/50 p-4">
				<dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{$t('events.detail.fields.occurrence_time')}
				</dt>
				<dd class="mt-1 text-base font-medium">{occurrenceTime ?? emptyValue}</dd>
			</div>
			<div class="rounded-lg border border-border bg-background/50 p-4">
				<dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{$t('events.detail.fields.created_at')}
				</dt>
				<dd class="mt-1 text-base font-medium">{createdAt ?? emptyValue}</dd>
			</div>
			<div class="rounded-lg border border-border bg-background/50 p-4">
				<dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{$t('events.detail.fields.updated_at')}
				</dt>
				<dd class="mt-1 text-base font-medium">{updatedAt ?? emptyValue}</dd>
			</div>
			<div class="rounded-lg border border-border bg-background/50 p-4 sm:col-span-2 md:col-span-1">
				<dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{$t('events.detail.fields.valence')}
				</dt>
				<dd class="mt-1 text-base font-medium">{valence ?? emptyValue}</dd>
			</div>
		</dl>
	</div>

	{#if emotions.length > 0}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold">{$t('events.detail.sections.emotions')}</h2>
			<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
				{#each emotions as emotion (emotion.id)}
					<div
						class="flex flex-col items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
					>
						<span class="text-sm">{emotion.label}</span>
						<span class="text-lg text-muted-foreground">
							{emotion.valence ?? emptyValue}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if associations.length > 0}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold">{$t('events.detail.sections.associations')}</h2>
			<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
				{#each associations as association (association.id)}
					<div
						class="flex flex-col items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
					>
						<span class="text-sm">{association.label}</span>
						<span class="text-lg text-muted-foreground">
							{association.valence ?? emptyValue}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if responses.length > 0}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold">{$t('events.detail.sections.responses')}</h2>
			<ul class="space-y-3">
				{#each responses as response (response.id)}
					<li class="rounded-lg border border-border bg-background/50 px-4 py-3">
						<p class="text-sm font-semibold text-muted-foreground">{response.label}</p>
						<p class="mt-1 whitespace-pre-wrap text-base">{response.value}</p>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
