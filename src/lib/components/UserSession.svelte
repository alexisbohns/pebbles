<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import AccountMenu from '$lib/components/AccountMenu.svelte';
	import placeholderAvatar from '$lib/assets/placeholder.png';
	import type { User } from '@supabase/supabase-js';
	import { setMode, userPrefersMode } from 'mode-watcher';

	type IdentityData = {
		avatar_url?: string | null;
		picture?: string | null;
		image?: string | null;
	};

	type ThemePreference = 'light' | 'dark' | 'system';

	export let user: User | null = null;

	const loginPath = '/login' as const;
	const profilePath = '/profile' as const;
	const logoutPath = '/logout' as const;

	const loginHref = resolve(loginPath);

	const getIdentityAvatar = (currentUser: User | null): string | null => {
		const identities = currentUser?.identities ?? [];

		for (const identity of identities) {
			const data = identity?.identity_data as IdentityData | null;

			if (!data) continue;

			const identityAvatar = data.avatar_url ?? data.picture ?? data.image ?? null;

			if (identityAvatar) {
				return identityAvatar;
			}
		}

		return null;
	};

	const readUserMetadata = () => (user?.user_metadata ?? {}) as Record<string, unknown>;

	let isAuthenticated = false;
	let displayName = '';
	let avatarUrl = '';
	let email = '';
	let themePreference: ThemePreference = 'system';

	$: isAuthenticated = Boolean(user);
	$: email = user?.email ?? '';

	$: {
		const metadata = readUserMetadata();

		const metadataName =
			(metadata['full_name'] as string | undefined) ??
			(metadata['name'] as string | undefined) ??
			(metadata['full-name'] as string | undefined);

		displayName = metadataName ?? email;
	}

	$: {
		const metadata = readUserMetadata();

		const metadataAvatar =
			(metadata['avatar_url'] as string | undefined) ??
			(metadata['avatar'] as string | undefined) ??
			(metadata['picture'] as string | undefined) ??
			(metadata['image'] as string | undefined) ??
			null;

		avatarUrl = metadataAvatar ?? getIdentityAvatar(user) ?? placeholderAvatar;
	}

	$: {
		const preference = (userPrefersMode.current ?? 'system') as ThemePreference;
		if (preference !== themePreference) {
			themePreference = preference;
		}
	}

	const handleAvatarError = (event: Event) => {
		const target = event.currentTarget as HTMLImageElement | null;

		if (!target || target.dataset.fallbackApplied === 'true') {
			return;
		}

		target.dataset.fallbackApplied = 'true';
		target.src = placeholderAvatar;
	};

	const handleThemeSelect = (value: string) => {
		const next = value === 'light' || value === 'dark' ? value : 'system';
		themePreference = next;
		setMode(next);
	};

	const goToProfile = () => {
		void goto(resolve(profilePath));
	};

	const goToLogout = () => {
		void goto(resolve(logoutPath));
	};
</script>

{#if isAuthenticated}
	<AccountMenu
		{displayName}
		{email}
		{avatarUrl}
		{themePreference}
		onAvatarError={handleAvatarError}
		onThemeSelect={handleThemeSelect}
		onProfile={goToProfile}
		onLogout={goToLogout}
	/>
{:else}
	<a href={loginHref} title={$t('common.login')} class="login">
		{$t('common.login')}
	</a>
{/if}

<style lang="postcss">
	a.login {
		font-size: 0.8rem;
	}
</style>
