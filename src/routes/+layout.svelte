<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import '../global.styl';
	import '../app.postcss';

	let { children, data } = $props();

	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<PageHeader user={data?.user ?? null} />

<main>{@render children?.()}</main>

<PageFooter user={data?.user ?? null} />

<style lang="stylus">
	main
		display flex
		flex-direction column
		width 100%
		max-width 500px
		align-self center
		padding 2rem 0
</style>
