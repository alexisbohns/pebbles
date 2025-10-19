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
</style>
