<script lang="ts">
	import { locale, t } from '$lib';
	import MarkdownContent from '$lib/components/MarkdownContent.svelte';
	import { resolve } from '$app/paths';
	import type { Token } from 'marked';

	type PageData = {
		slug: string;
		tokens: Record<string, Token[]>;
	};

	type LocalizedPageTitle = `pages.${string}.title`;

	export let data: PageData;

	let fallbackLocale = 'en';

	$: fallbackLocale = 'en' in data.tokens ? 'en' : Object.keys(data.tokens)[0];
	$: currentLocale = $locale;
	$: tokens = data.tokens[currentLocale] ?? data.tokens[fallbackLocale];
	$: titleKey = `pages.${data.slug}.title` satisfies LocalizedPageTitle;
</script>

<svelte:head>
	<title>{$t(titleKey)}</title>
</svelte:head>

<div class="page selectable">
	<div class="page__header">
		<a class="back" href={resolve('/')}>{$t('common.back')}</a>
	</div>
	<div class="content">
		<MarkdownContent {tokens} />
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
		line-height 1.6

		:global(h1)
			font-size 2rem
			margin-bottom 1rem

		:global(h2)
			font-size 1.2rem
			font-weight 600
			margin 2rem 0 1rem

		:global(p)
			margin 0 0 1rem
			opacity 0.8

		:global(ul)
			margin 0 0 1.5rem
			padding-left 1.2rem

		:global(li)
			margin 0.4rem 0
			list-style-type "✻"
			padding-left 1rem

		:global(a)
			text-decoration underline
			color inherit
</style>
