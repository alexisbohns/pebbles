<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale, t } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { RESOURCE_LINK_CATEGORIES, type NewsroomRecord } from '$lib/newsroom/types';
	import { getActionLabel, getCategoryLabel } from '$lib/newsroom/utils';
	import { CircleDot, Newspaper, OctagonAlert, PackagePlus } from '@lucide/svelte';
	import Capsule from '../Capsule.svelte';

	export let item: NewsroomRecord;

	const externalCategories = new Set(RESOURCE_LINK_CATEGORIES);

	let translate: (key: string) => string = (key) => key;
	$: translate = $t;

	$: currentLocale = $locale;
	$: formattedDate = formatDate(item.created_at, currentLocale);
	$: localizedName = resolveLocalizedField(item.name, item.name_en, currentLocale);
	$: localizedDescription = resolveLocalizedField(
		item.description,
		item.description_en,
		currentLocale
	);

	let actionLabel = '';
	let categoryLabel = '';
	let isExternal = false;
	let ctaHref: string | null = null;
	let ctaTarget: '_blank' | undefined;
	let ctaRel: 'noopener noreferrer' | undefined;

	$: {
		const category = item.category;
		actionLabel = getActionLabel(translate, category);
		categoryLabel = getCategoryLabel(translate, category);
		isExternal = externalCategories.has(category as never);
		if (isExternal) {
			ctaHref = item.resource ?? null;
			ctaTarget = ctaHref ? '_blank' : undefined;
			ctaRel = ctaHref ? 'noopener noreferrer' : undefined;
		} else {
			ctaHref = resolve(`/newsroom/${item.id}`);
			ctaTarget = undefined;
			ctaRel = undefined;
		}
	}

	function formatDate(value: string, localeCode: string) {
		if (!value) return '';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return value;
		return new Intl.DateTimeFormat(localeCode || undefined, { dateStyle: 'medium' }).format(parsed);
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
</script>

<article class="newsroom-item flex gap-4">
	<div class="newsroom-item-line">
		{#if item.category == 'changelog'}
			<PackagePlus class="h-[1.2rem] w-[1.2rem] text-stone-500" />
		{:else if item.category == 'news'}
			<Newspaper class="h-[1.2rem] w-[1.2rem] text-primary" />
		{:else if item.category == 'incident'}
			<OctagonAlert class="h-[1.2rem] w-[1.2rem] text-amber-500" />
		{:else}
			<CircleDot class="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
		{/if}
	</div>
	<div class="flex flex-col items-start gap-2 pb-3">
		<Capsule
			capsuleLabel={item.category ? categoryLabel : ''}
			time={formattedDate}
			datetime={item.created_at}
		/>
		<div class="flex gap-3">
			<div>
				<h3 class="font-semibold">{localizedName}</h3>
				{#if localizedDescription}
					<p class="text-sm">{localizedDescription}</p>
				{/if}
			</div>
			{#if ctaHref}
				<Button
					variant="outline"
					href={ctaHref}
					target={ctaTarget}
					rel={ctaRel}
					aria-label={actionLabel}
					title={actionLabel}
					size="sm"
				>
					{actionLabel}
				</Button>
			{/if}
		</div>
	</div>
</article>

<style lang="stylus">
	.newsroom-item
		&-line
			display flex
			flex-direction column
			align-items center
			justify-content stretch
			align-self stretch
			gap 0.5rem
			padding-top 0.25rem

			&::after
				content " "
				width 3px
				flex-grow 1
				background var(--foreground-color)
				opacity 0.1
			
			&::after
				border-radius 10rem 10rem 0 0
			
		&:last-child
			.newsroom-item-line::after
				visibility hidden
</style>
