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
	import { t } from '$lib';
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
			errorMessage = $t('auth.login.errors.email_required');
			return;
		}

		if (!password) {
			errorMessage = $t('auth.login.errors.password_required');
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
			const fallback = $t('auth.login.errors.unexpected');
			const message = error instanceof Error ? error.message : fallback;
			errorMessage = message || fallback;
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
			<Card.Title>{$t('auth.login.heading')}</Card.Title>
			<Card.Description>{$t('auth.login.description')}</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<form class="grid gap-4" on:submit|preventDefault={signInWithPassword}>
				<div class="grid gap-2">
					<Label for="email">{$t('auth.login.fields.email')}</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder={$t('auth.login.fields.email_placeholder')}
						bind:value={email}
						autocomplete="email"
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">{$t('auth.login.fields.password')}</Label>
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
						{$t('auth.login.submitting')}
					{:else}
						{$t('auth.login.submit')}
					{/if}
				</Button>
			</form>
			<div class="relative">
				<div class="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
					<span class="h-px w-full bg-border"></span>
					<span>{$t('auth.login.divider')}</span>
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
						{$t('auth.login.google.submitting')}
					{:else}
						{$t('auth.login.google.submit')}
					{/if}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">{$t('auth.login.footer.prompt')}</p>
			<Button variant="link" href={resolve('/signup')} class="px-0">
				{$t('auth.login.footer.action')}
			</Button>
		</Card.Footer>
	</Card.Root>
</section>
