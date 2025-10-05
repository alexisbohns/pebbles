<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';
	import { get } from 'svelte/store';

	let signingIn = false;
	let errorMessage = '';
	$: queryError = $page.url.searchParams.get('error');
	$: displayError = errorMessage || queryError || '';

	const signInWithGoogle = async () => {
		if (signingIn) return;
		signingIn = true;
		errorMessage = '';

		const currentPage = get(page);
		const redirectTo = browser
			? new URL(resolve('/auth/callback'), currentPage.url).toString()
			: null;

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
