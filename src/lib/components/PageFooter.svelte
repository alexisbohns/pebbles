<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { t } from '$lib';

	const navigate = (path: `/${string}`) => goto(resolve(path));
</script>

<div class="page-footer selectable">
	<nav class="page-footer__links">
		<a href={resolve('/login')} on:click|preventDefault={() => navigate('/login')}>
			{$t('pages.login.title')}
		</a>
		<a href={resolve('/profile')} on:click|preventDefault={() => navigate('/profile')}>
			{$t('pages.profile.title')}
		</a>
		<a href={resolve('/legal')} on:click|preventDefault={() => navigate('/legal')}>
			{$t('pages.legal.title')}
		</a>
		<a href={resolve('/privacy')} on:click|preventDefault={() => navigate('/privacy')}>
			{$t('pages.privacy.title')}
		</a>
		<a href={resolve('/about')} on:click|preventDefault={() => navigate('/about')}>
			{$t('pages.about.title')}
		</a>
	</nav>
	<p>{$t('legal.mention')}</p>
	<a
		href={`https://${$t('legal.external_link').replace(/^https?:\/\//, '')}`}
		target="_blank"
		rel="noopener noreferrer"
		aria-label={$t('legal.external_label')}
		title={$t('legal.external_label')}>{$t('legal.external_label')}</a
	>
	<ThemeToggle />
</div>

<style lang="stylus">
	.page-footer
		display flex
		flex-direction column
		align-items start
		gap .5rem

		font-size .8rem
		color var(--e05)

	.page-footer__links
		display flex
		flex-wrap wrap
		gap .75rem
		font-family var(--f-serif)
		font-size .9rem

		:global(a)
			text-decoration underline
			color inherit
</style>
