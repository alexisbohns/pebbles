<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import { ModeWatcher } from 'mode-watcher';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
</script>

<div class="page-footer selectable">
	<p class="page-footer-text">{$t('legal.mention')}</p>
	<nav class="page-footer-links">
		<a href={resolve('/legal')}>
			{$t('pages.legal.title')}
		</a>
		<a href={resolve('/privacy')}>
			{$t('pages.privacy.title')}
		</a>
		<a href={resolve('/about')}>
			{$t('pages.about.title')}
		</a>
		<a href={resolve('/newsroom')}>
			{$t('newsroom.name')}
		</a>
	</nav>
	<ModeWatcher />
	<ModeToggle />
</div>

<style lang="postcss">
	.page-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		font-weight: 300;
		gap: 0.25rem;
		margin-top: 2rem;
		font-size: 0.8rem;
	}

	.page-footer-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.page-footer-text {
		opacity: 0.6;
		font-weight: 200;
	}
</style>
