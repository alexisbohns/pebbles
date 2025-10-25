<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { get } from 'svelte/store';

	let email = '';
	let password = '';
	let passwordSigningIn = false;
	let oauthSigningIn = false;
	let errorMessage = '';
	$: queryError = $page.url.searchParams.get('error');
	$: displayError = errorMessage || queryError || '';

	const signInWithGoogle = async () => {
		if (oauthSigningIn || passwordSigningIn) return;
		oauthSigningIn = true;
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
			oauthSigningIn = false;
		}
	};

	const handleGoogleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		await signInWithGoogle();
	};

	const signInWithPassword = async (event: SubmitEvent) => {
		event.preventDefault();

		if (passwordSigningIn || oauthSigningIn) return;

		errorMessage = '';

		const trimmedEmail = email.trim();

		if (!trimmedEmail) {
			errorMessage = 'Email is required.';
			return;
		}

		if (!password) {
			errorMessage = 'Password is required.';
			return;
		}

		passwordSigningIn = true;

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: trimmedEmail,
				password
			});

			if (error) {
				errorMessage = error.message;
				return;
			}

			if (data.session) {
				await goto(resolve('/'));
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unexpected error signing in.';
			errorMessage = message;
		} finally {
			passwordSigningIn = false;
		}
	};
</script>

<section
	class="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center px-4"
>
	<Card.Root class="w-full shadow-lg">
		<Card.Header class="space-y-1">
			<Card.Title>Sign in to your account</Card.Title>
			<Card.Description>Enter your email and password to continue.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<form class="grid gap-4" on:submit|preventDefault={signInWithPassword}>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						autocomplete="email"
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="••••••••"
						bind:value={password}
						autocomplete="current-password"
						required
					/>
				</div>
				{#if displayError}
					<p class="text-sm font-medium text-destructive">{displayError}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={passwordSigningIn}>
					{#if passwordSigningIn}
						Signing in...
					{:else}
						Sign in
					{/if}
				</Button>
			</form>
			<div class="relative">
				<div class="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
					<span class="h-px w-full bg-border"></span>
					<span>Or continue with</span>
					<span class="h-px w-full bg-border"></span>
				</div>
			</div>
			<form on:submit={handleGoogleSubmit}>
				<Button
					type="submit"
					variant="outline"
					class="w-full"
					disabled={oauthSigningIn || passwordSigningIn}
				>
					{#if oauthSigningIn}
						Signing in with Google...
					{:else}
						Sign in with Google
					{/if}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">Need an account?</p>
			<Button variant="link" href={resolve('/signup')} class="px-0">Create one</Button>
		</Card.Footer>
	</Card.Root>
</section>
