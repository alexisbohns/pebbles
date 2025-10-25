<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib';
	import MarkdownContent from '$lib/components/MarkdownContent.svelte';
	import { getCategoryLabel } from '$lib/newsroom/utils';
	import type { PageData } from './$types';
	import type { Token } from 'marked';

	export let data: PageData;

	let translate: (key: string) => string = (key) => key;
	$: translate = $t;

	$: currentLocale = $locale;
	$: formattedDate = formatDate(data.item.created_at, currentLocale);
	$: categoryLabel = getCategoryLabel(translate, data.item.category);
	$: backLabel = translate('common.back');
	$: localizedName = resolveLocalizedField(data.item.name, data.item.name_en, currentLocale);
	$: localizedDescription = resolveLocalizedField(
		data.item.description,
		data.item.description_en,
		currentLocale
	);
	$: resolvedTokens = pickTokensForLocale(currentLocale, data.tokens);
	$: hasContent = resolvedTokens.length > 0;

	function formatDate(value: string, localeCode: string) {
		if (!value) return '';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return value;
		return new Intl.DateTimeFormat(localeCode || undefined, { dateStyle: 'long' }).format(parsed);
	}

	function resolveLocalizedField(
		primary: string | null,
		english: string | null,
		localeCode: string
	) {
		const base = primary ?? english ?? '';
		if (!localeCode) return base;
		const normalized = localeCode.toLowerCase();
		if (normalized.startsWith('en')) {
			return english ?? base;
		}
		return primary ?? base;
	}

	function pickTokensForLocale(localeCode: string, tokensMap: Record<string, Token[]>) {
		const entries = Object.entries(tokensMap);
		if (entries.length === 0) return [];

		const normalized = localeCode?.toLowerCase();
		if (normalized && tokensMap[normalized]) {
			return tokensMap[normalized];
		}

		const base = normalized?.split('-')[0];
		if (base && tokensMap[base]) {
			return tokensMap[base];
		}

		if (tokensMap.fr) return tokensMap.fr;
		if (tokensMap.en) return tokensMap.en;

		return entries[0][1];
	}
</script>

<svelte:head>
	<title>{localizedName}</title>
</svelte:head>

<article>
	<header>
		<a href={resolve('/newsroom')}>{backLabel}</a>

		<div>
			{#if categoryLabel}
				<span>{categoryLabel}</span>
			{/if}
			{#if data.item.type}
				<span>
					{data.item.type}
				</span>
			{/if}
			{#if formattedDate}
				<time datetime={data.item.created_at}>{formattedDate}</time>
			{/if}
		</div>

		<h1>{localizedName}</h1>

		{#if localizedDescription}
			<p class="text-lg mb-10 text-muted-foreground">{localizedDescription}</p>
		{/if}
	</header>

	<section class="markdown-content">
		{#if hasContent}
			<MarkdownContent tokens={resolvedTokens} />
		{:else}
			<p>
				{translate('newsroom.empty')}
			</p>
		{/if}
	</section>
</article>
