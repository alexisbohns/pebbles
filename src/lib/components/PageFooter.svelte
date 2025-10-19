<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import type { User } from '@supabase/supabase-js';
	import { ModeWatcher } from 'mode-watcher';
	import ModeToggle from '$lib/components/ModeToggle.svelte';

	let { user = null } = $props<{ user: User | null }>();

	const isAuthenticated = $derived(Boolean(user));
	const authPath = $derived((user ? '/logout' : '/login') as `/${string}`);
</script>

<div class="page-footer selectable">
	<p>{$t('legal.mention')}</p>
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
	</nav>
	<ModeWatcher />
	<ModeToggle />
</div>

<style lang="stylus">
	.page-footer
		display flex
		flex-direction column
		align-items center
		gap .25rem

		font-size .8rem
		color var(--e05)

		&-links
			display flex
			flex-wrap wrap
			gap .75rem

			a
				color var(--e10)
				opacity 0.3
</style>
