<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { get } from 'svelte/store';

	const passwordRequirement =
		'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

	let email = '';
	let password = '';
	let isSubmitting = false;
	let errorMessage = '';
	let successMessage = '';

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		if (isSubmitting) return;

		errorMessage = '';
		successMessage = '';

		const trimmedEmail = email.trim();

		if (!trimmedEmail) {
			errorMessage = 'Email is required.';
			return;
		}

		if (!passwordPattern.test(password)) {
			errorMessage = passwordRequirement;
			return;
		}

		isSubmitting = true;

		try {
			const currentPage = get(page);
			const redirectTo = browser
				? new URL(resolve('/auth/callback'), currentPage.url).toString()
				: undefined;

			const { error } = await supabase.auth.signUp({
				email: trimmedEmail,
				password,
				options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
			});

			if (error) {
				errorMessage = error.message;
				return;
			}

			successMessage = 'Success! Check your email to verify your account.';
			email = '';
			password = '';
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Unexpected error creating your account.';
			errorMessage = message;
		} finally {
			isSubmitting = false;
		}
	};
</script>

<section
	class="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center px-4"
>
	<Card.Root class="w-full shadow-lg">
		<Card.Header class="space-y-1">
			<Card.Title>Create an account</Card.Title>
			<Card.Description>Enter your email and a strong password to sign up.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form class="grid gap-4" on:submit|preventDefault={handleSubmit}>
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
						autocomplete="new-password"
						required
					/>
					<p class="text-xs text-muted-foreground">{passwordRequirement}</p>
				</div>
				{#if errorMessage}
					<p class="text-sm font-medium text-destructive">{errorMessage}</p>
				{:else if successMessage}
					<p class="text-sm font-medium text-emerald-600">{successMessage}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{#if isSubmitting}
						Creating account...
					{:else}
						Create account
					{/if}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">Already have an account?</p>
			<Button variant="link" href={resolve('/login')} class="px-0">Sign in</Button>
		</Card.Footer>
	</Card.Root>
</section>
