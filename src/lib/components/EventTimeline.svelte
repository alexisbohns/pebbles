<script lang="ts">
	import { resolve } from '$app/paths';
	import EventTimelineItem from './EventTimelineItem.svelte';
	import type { EventSummary } from '$lib/types/events';
	import { t } from '$lib';
	import { Button } from '$lib/components/ui/button';

	let { events = [] }: { events?: EventSummary[] } = $props();

	const heading = $derived($t('timeline.title'));
	const emptyLabel = $derived($t('timeline.empty'));
	const createLabel = $derived($t('timeline.create'));

	const eventTimestamp = (event: EventSummary): number => {
		const date = typeof event.occurrence_date === 'string' ? event.occurrence_date : '';
		if (!date) {
			return Number.NEGATIVE_INFINITY;
		}

		const timeValue =
			typeof event.occurrence_time === 'string' ? event.occurrence_time.trim() : undefined;
		const normalizedTime = timeValue && timeValue.length === 5 ? `${timeValue}:00` : timeValue;

		const candidate = Date.parse(`${date}T${normalizedTime ?? '00:00:00'}`);
		if (!Number.isNaN(candidate)) {
			return candidate;
		}

		const fallback = Date.parse(`${date}T00:00:00`);
		return Number.isNaN(fallback) ? Number.NEGATIVE_INFINITY : fallback;
	};

	const sortedEvents = $derived.by(() => {
		if (!Array.isArray(events) || events.length === 0) {
			return [];
		}

		return [...events].sort((a, b) => {
			const diff = eventTimestamp(b) - eventTimestamp(a);
			if (diff !== 0) {
				return diff;
			}

			const idA = typeof a.id === 'string' ? a.id : '';
			const idB = typeof b.id === 'string' ? b.id : '';
			return idA.localeCompare(idB);
		});
	});
</script>

<header class="mb-5">
	<h1>{heading}</h1>
	<Button href={resolve('/create')}>
		{createLabel}
	</Button>
</header>
<section>
	{#if sortedEvents.length === 0}
		<p>{emptyLabel}</p>
	{:else}
		{#each sortedEvents as event (event.id)}
			<EventTimelineItem {event} />
		{/each}
	{/if}
</section>
