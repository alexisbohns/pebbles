<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import type { User } from '@supabase/supabase-js';
	import Logo from '$lib/components/Logo.svelte';
	import UserSession from '$lib/components/UserSession.svelte';

	export let user: User | null = null;
</script>

<header>
	<a
		href={resolve('/')}
		aria-label={$t('home.title')}
		style="display: inline-flex; align-items: center;"
	>
		<Logo alt={$t('home.title')} size="sm" />
	</a>
	<UserSession {user} />
</header>

<style lang="stylus">
	header
		position sticky
		top 0
		z-index 20
		display flex
		align-items center
		justify-content space-between
		gap 1rem
</style>
