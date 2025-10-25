<script lang="ts">
	import { dev } from '$app/environment';
	import EventTimeline from '$lib/components/EventTimeline.svelte';
	import LandingContent from '$lib/components/LandingContent.svelte';
	import type { PageData } from './$types';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	export let data: PageData;

	let events = data.events ?? [];
	$: events = data.events ?? [];
</script>

{#if data.user}
	<EventTimeline {events} />
{:else}
	<LandingContent />
{/if}
