<script lang="ts">
	import { resolve } from '$app/paths';
	import EventTimelineItem from './EventTimelineItem.svelte';
	import type { EventSummary } from '$lib/types/events';
	import { t } from '$lib';

	let { events = [] }: { events?: EventSummary[] } = $props();

	const heading = $derived($t('timeline.title'));
	const emptyLabel = $derived($t('timeline.empty'));
	const createLabel = $derived($t('timeline.create'));
</script>

<section>
	<header>
		<h1>{heading}</h1>
		<a href={resolve('/create')}>{createLabel}</a>
	</header>
	{#if events.length === 0}
		<p>{emptyLabel}</p>
	{:else}
		{#each events as event (event.id)}
			<EventTimelineItem {event} />
		{/each}
	{/if}
</section>
