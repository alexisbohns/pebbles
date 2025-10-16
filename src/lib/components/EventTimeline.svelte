<script lang="ts">
	import EventTimelineItem from './EventTimelineItem.svelte';
	import type { EventSummary } from '$lib/types/events';
	import { t } from '$lib';

	let { events = [] }: { events?: EventSummary[] } = $props();

	const heading = $derived($t('timeline.title'));
	const emptyLabel = $derived($t('timeline.empty'));
</script>

<section>
	<h1>{heading}</h1>
	{#if events.length === 0}
		<p>{emptyLabel}</p>
	{:else}
		<ul>
			{#each events as event (event.id)}
				<li>
					<EventTimelineItem {event} />
				</li>
			{/each}
		</ul>
	{/if}
</section>
