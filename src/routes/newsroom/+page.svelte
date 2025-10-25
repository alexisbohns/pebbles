<script lang="ts">
	import { t } from '$lib';
	import NewsroomItem from '$lib/components/newsroom/NewsroomItem.svelte';
	import { Toggle } from '$lib/components/ui/toggle';
	import {
		TooltipProvider,
		Tooltip,
		TooltipTrigger,
		TooltipContent
	} from '$lib/components/ui/tooltip';
	import type { PageData } from './$types';

	export let data: PageData;

	let activeCategory: string | null = null;

	$: translate = $t;
	$: allLabel = translate('newsroom.categories.all.all.short');
	$: allAction = translate('newsroom.categories.all.all.action');
	$: filtersHeading = translate('newsroom.filters.heading');
	$: heading = translate('newsroom.name');
	$: description = translate('newsroom.description');

	$: items = data.items;
	$: availableCategories = data.availableCategories;
	$: filteredItems =
		activeCategory === null ? items : items.filter((item) => item.category === activeCategory);
	$: hasItems = filteredItems.length > 0;

	function toggleCategory(category: string, pressed: boolean) {
		activeCategory = pressed ? category : null;
	}
</script>

<svelte:head>
	<title>{heading}</title>
</svelte:head>

<section class="newsroom-view">
	<header>
		<h1>{heading}</h1>
		<p>{description}</p>
	</header>

	{#if availableCategories.length > 0}
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
			<span class="tracking-wider text-muted-foreground text-xs uppercase">{filtersHeading}</span>
			<TooltipProvider>
				<div>
					<Tooltip>
						<TooltipTrigger>
							{#snippet child({ props })}
								<Toggle
									{...props}
									variant="outline"
									size="sm"
									pressed={activeCategory === null}
									onPressedChange={() => {
										activeCategory = null;
									}}
									aria-label={allAction}
									title={allAction}
								>
									{allLabel}
								</Toggle>
							{/snippet}
						</TooltipTrigger>
						<TooltipContent>{allAction}</TooltipContent>
					</Tooltip>

					{#each availableCategories as category (category)}
						{@const toggleLabel = translate(`newsroom.categories.${category}.all.short`)}
						{@const toggleAction = translate(`newsroom.categories.${category}.all.action`)}
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<Toggle
										{...props}
										variant="outline"
										size="sm"
										pressed={activeCategory === category}
										onPressedChange={(pressed) => toggleCategory(category, pressed)}
										aria-label={toggleAction}
										title={toggleAction}
									>
										{toggleLabel}
									</Toggle>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>{toggleAction}</TooltipContent>
						</Tooltip>
					{/each}
				</div>
			</TooltipProvider>
		</div>
	{/if}

	{#if hasItems}
		<div class="flex flex-col gap-2 py-8">
			{#each filteredItems as item (item.id)}
				<NewsroomItem {item} />
			{/each}
		</div>
	{:else}
		<p>{translate('newsroom.empty')}</p>
	{/if}
</section>
