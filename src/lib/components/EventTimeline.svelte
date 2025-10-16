<script lang="ts">
	import EventTimelineItem from './EventTimelineItem.svelte';
	import type { EventSummary } from '$lib/types/events';

	let { events = [] }: { events?: EventSummary[] } = $props();
</script>

<section>
	<h2>Your Events</h2>
	{#if events.length === 0}
		<p>No events to display yet.</p>
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
