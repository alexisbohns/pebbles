<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
