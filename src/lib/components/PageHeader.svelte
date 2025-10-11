<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import type { User } from '@supabase/supabase-js';
	import Logo from '$lib/components/Logo.svelte';
	import UserSession from '$lib/components/UserSession.svelte';

	export let user: User | null = null;
</script>

<header
	style="
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--e00);
		padding: 0.75rem 0;
		margin-bottom: 1.5rem;
	"
>
	<div
		style="
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
		"
	>
		<a
			href={resolve('/')}
			aria-label={$t('home.title')}
			style="display: inline-flex; align-items: center;"
		>
			<Logo alt={$t('home.title')} size="sm" />
		</a>
		<UserSession {user} />
	</div>
</header>
