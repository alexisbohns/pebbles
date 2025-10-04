<script lang="ts">
	import { locale, t } from '$lib';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	type PageData = {
		slug: string;
		rendered: Record<string, string>;
	};

	type LocalizedPageTitle = `pages.${string}.title`;

	export let data: PageData;

	let fallbackLocale = 'en';

	$: fallbackLocale = 'en' in data.rendered ? 'en' : Object.keys(data.rendered)[0];
	$: currentLocale = $locale;
	$: html = data.rendered[currentLocale] ?? data.rendered[fallbackLocale];
	$: titleKey = `pages.${data.slug}.title` satisfies LocalizedPageTitle;
</script>

<svelte:head>
	<title>{$t(titleKey)}</title>
</svelte:head>

<div class="page selectable">
	<div class="page__header">
		<a class="back" href="/">{$t('common.back')}</a>
		<ThemeToggle />
	</div>
	<div class="content">
		{@html html}
	</div>
</div>

<style lang="stylus">
	.page
		display flex
		flex-direction column
		gap 1.5rem
		padding 0 0 3rem

	.page__header
		display flex
		align-items center
		justify-content space-between
		gap 1rem

	.back
		font-size .9rem
		font-weight 500

	.content
		font-family var(--f-serif)
		font-size 1.05rem
		line-height 1.6
		color var(--e10)

		:global(h1)
			font-family 'Seaweed Script', cursive
			font-size 2.5rem
			margin-bottom 1rem

		:global(h2)
			font-family var(--f-serif)
			font-size 1.4rem
			margin 2rem 0 1rem

		:global(p)
			margin 0 0 1rem

		:global(ul)
			margin 0 0 1.5rem
			padding-left 1.2rem

		:global(li)
			margin 0.4rem 0

		:global(a)
			text-decoration underline
			color inherit

		:global(a:hover)
			opacity .7
</style>
