<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import type { User } from '@supabase/supabase-js';

	type IdentityData = {
		avatar_url?: string | null;
		picture?: string | null;
		image?: string | null;
	};

	export let user: User | null = null;

	const loginHref = resolve('/login');
	const profileHref = resolve('/profile');

	const getInitial = (value: string | null | undefined) => {
		return value?.trim()?.charAt(0)?.toUpperCase() ?? 'P';
	};

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

	const generateFallbackAvatar = (initial: string) => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#d9cbc3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Sora, system-ui, sans-serif" font-size="28" fill="#211E1C">${initial}</text></svg>`;

		return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
	};

	const readUserMetadata = () => (user?.user_metadata ?? {}) as Record<string, unknown>;

	let isAuthenticated = false;
	let displayName = '';
	let avatarUrl = '';

	$: isAuthenticated = Boolean(user);

	$: {
		const metadata = readUserMetadata();

		const metadataName =
			(metadata['full_name'] as string | undefined) ??
			(metadata['name'] as string | undefined) ??
			(metadata['full-name'] as string | undefined);

		displayName = metadataName ?? user?.email ?? '';
	}

	$: {
		const metadata = readUserMetadata();

		const metadataAvatar =
			(metadata['avatar_url'] as string | undefined) ??
			(metadata['avatar'] as string | undefined) ??
			(metadata['picture'] as string | undefined) ??
			(metadata['image'] as string | undefined) ??
			null;

		const fallbackInitial = getInitial(displayName);
		const fallbackAvatar = generateFallbackAvatar(fallbackInitial);

		avatarUrl = metadataAvatar ?? getIdentityAvatar(user) ?? fallbackAvatar;
	}
</script>

{#if isAuthenticated}
	<a href={profileHref} title={$t('pages.profile.title')}>
		<img
			src={avatarUrl}
			alt={displayName ? `${displayName}'s avatar` : 'Profile avatar'}
			width="44"
			height="44"
			loading="lazy"
		/>
	</a>
{:else}
	<a href={loginHref} title={$t('pages.login.title')}>
		{$t('pages.login.title')}
	</a>
{/if}
