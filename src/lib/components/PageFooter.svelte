<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { t } from '$lib';
	import type { User } from '@supabase/supabase-js';

	let { user = null } = $props<{ user: User | null }>();

	const isAuthenticated = $derived(Boolean(user));
	const authPath = $derived((user ? '/logout' : '/login') as `/${string}`);
</script>

<div class="page-footer selectable">
	<nav class="page-footer__links">
		<a href={resolve(authPath)}>
			{isAuthenticated ? $t('pages.logout.title') : $t('pages.login.title')}
		</a>
		<a href={resolve('/profile')}>
			{$t('pages.profile.title')}
		</a>
		<a href={resolve('/legal')}>
			{$t('pages.legal.title')}
		</a>
		<a href={resolve('/privacy')}>
			{$t('pages.privacy.title')}
		</a>
		<a href={resolve('/about')}>
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
