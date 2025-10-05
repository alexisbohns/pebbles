<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';

	let signingIn = false;
	let errorMessage = '';
	$: queryError = $page.url.searchParams.get('error');
	$: displayError = errorMessage || queryError || '';

	const signInWithGoogle = async () => {
		if (signingIn) return;
		signingIn = true;
		errorMessage = '';

		const redirectTo =
			typeof window === 'undefined' ? null : `${window.location.origin}/auth/callback`;

		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: redirectTo ? { redirectTo } : undefined
		});

		if (error) {
			errorMessage = error.message;
			signingIn = false;
		}
	};
</script>

<button type="button" on:click={signInWithGoogle} disabled={signingIn}>
	Sign in with Google
</button>

{#if displayError}
	<p>{displayError}</p>
{/if}
