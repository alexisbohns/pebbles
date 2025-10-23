<script lang="ts">
	import EventTimeline from '$lib/components/EventTimeline.svelte';
	import LandingContent from '$lib/components/LandingContent.svelte';
	import type { PageData } from './$types';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'

	let { data }: { data: PageData } = $props();
	const events = data.events ?? [];
</script>

{#if data.user}
	<EventTimeline {events} />
{:else}
	<LandingContent />
{/if}
