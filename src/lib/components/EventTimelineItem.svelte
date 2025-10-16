<script lang="ts">
	import { resolve } from '$app/paths';
	import type { EventSummary } from '$lib/types/events';

	let { event }: { event: EventSummary } = $props();

	const link = resolve('/events/[id]', { id: event.id });
	const title =
		typeof event.name === 'string' && event.name.trim().length > 0
			? event.name.trim()
			: typeof event.kind === 'string' && event.kind.trim().length > 0
				? event.kind.trim()
				: `Event ${event.id.slice(0, 8)}`;
	const occurrenceDate =
		typeof event.occurrence_date === 'string' && event.occurrence_date.trim().length > 0
			? event.occurrence_date
			: null;
	const valence =
		typeof event.valence === 'number' && Number.isFinite(event.valence) ? event.valence : null;
</script>

<article>
	<a href={link}>
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
					<span>Valence: {valence}</span>
				{/if}
			</p>
		{/if}
		{#if typeof event.description === 'string' && event.description.trim().length > 0}
			<p>{event.description}</p>
		{/if}
	</a>
</article>
