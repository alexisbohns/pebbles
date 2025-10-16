<script lang="ts">
	import EventTimeline from '$lib/components/EventTimeline.svelte';
	import LandingContent from '$lib/components/LandingContent.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const events = data.events ?? [];
</script>

{#if data.user}
	<EventTimeline {events} />
{:else}
	<LandingContent />
{/if}
