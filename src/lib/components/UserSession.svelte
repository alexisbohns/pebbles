<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import type { User } from '@supabase/supabase-js';
	import placeholderAvatar from '$lib/assets/placeholder.png';

	type IdentityData = {
		avatar_url?: string | null;
		picture?: string | null;
		image?: string | null;
	};

	export let user: User | null = null;

	const loginHref = resolve('/login');
	const profileHref = resolve('/profile');

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

		avatarUrl = metadataAvatar ?? getIdentityAvatar(user) ?? placeholderAvatar;
	}
</script>

{#if isAuthenticated}
	<a href={profileHref} title={$t('pages.profile.title')}>
		<img
			src={avatarUrl}
			alt={displayName ? `${displayName}'s avatar` : 'Profile avatar'}
			width="32"
			height="32"
			loading="lazy"
		/>
	</a>
{:else}
	<a href={loginHref} title={$t('pages.login.title')}>
		{$t('pages.login.title')}
	</a>
{/if}
