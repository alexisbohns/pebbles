<script lang="ts">
	import placeholderAvatar from '$lib/assets/placeholder.png';

	let { data } = $props();
	const profile = data.profile;
	const hasProfileInfo = data.hasProfileInfo;

	const handleAvatarError = (event: Event) => {
		const target = event.currentTarget as HTMLImageElement | null;

		if (!target || target.dataset.fallbackApplied === 'true') {
			return;
		}

		target.dataset.fallbackApplied = 'true';
		target.src = placeholderAvatar;
	};
</script>

<h1>Your Profile</h1>

{#if profile && hasProfileInfo}
	<p><strong>Full name:</strong> {profile.full_name ?? 'Unknown user'}</p>

	{#if profile.avatar_url}
		<img
			src={profile.avatar_url}
			alt={`Profile picture of ${profile.full_name ?? 'user'}`}
			width="120"
			height="120"
			onerror={handleAvatarError}
		/>
	{/if}

	<p><strong>Role:</strong> {profile.role ?? '—'}</p>
	<p>
		<strong>Created at:</strong>
		{profile.created_at ? new Date(profile.created_at).toLocaleString() : '—'}
	</p>
{:else}
	<p>No profile information available.</p>
{/if}
