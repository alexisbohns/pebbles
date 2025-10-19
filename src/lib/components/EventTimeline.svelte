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
</script>

<header class="mb-5">
	<h1>{heading}</h1>
	<Button href={resolve('/create')}>
		{createLabel}
	</Button>
</header>
<section>
	{#if events.length === 0}
		<p>{emptyLabel}</p>
	{:else}
		{#each events as event (event.id)}
			<EventTimelineItem {event} />
		{/each}
	{/if}
</section>
