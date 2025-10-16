<script lang="ts">
	import { resolve } from '$app/paths';
	import type { EventSummary } from '$lib/types/events';
	import { t } from '$lib';

	let { event }: { event: EventSummary } = $props();

	const fallbackTitle = $derived.by(() =>
		$t('timeline.item.fallback_title', { id: (event?.id ?? '').slice(0, 8) })
	);
	const title = $derived.by(() => {
		const name = typeof event?.name === 'string' ? event.name.trim() : '';
		if (name.length > 0) return name;

		const kind = typeof event?.kind === 'string' ? event.kind.trim() : '';
		if (kind.length > 0) return kind;

		return fallbackTitle;
	});
	const occurrenceDate = $derived.by(() => {
		const value = typeof event?.occurrence_date === 'string' ? event.occurrence_date.trim() : '';
		return value.length > 0 ? value : null;
	});
	const valence = $derived.by(() =>
		typeof event?.valence === 'number' && Number.isFinite(event.valence) ? event.valence : null
	);
	const valenceLabel = $derived.by(() =>
		valence !== null ? $t('timeline.item.valence', { value: valence }) : null
	);
</script>

<article>
	<a href={resolve('/events/[id]', { id: event?.id ?? '' })}>
		<h3>{title}</h3>
		{#if occurrenceDate || valence !== null}
			<p>
				{#if occurrenceDate}
					<span>{occurrenceDate}</span>
				{/if}
				{#if occurrenceDate && valence !== null}
					<span> · </span>
				{/if}
				{#if valence !== null}
					<span>{valenceLabel}</span>
				{/if}
			</p>
		{/if}
		{#if typeof event.description === 'string' && event.description.trim().length > 0}
			<p>{event.description}</p>
		{/if}
	</a>
</article>
