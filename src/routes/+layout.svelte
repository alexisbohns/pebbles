<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import '../global.styl';

	let { children } = $props();

	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<PageFooter />
