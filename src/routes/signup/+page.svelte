<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabaseClient';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	const passwordRequirement =
		'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

	let name = '';
	let email = '';
	let password = '';
	let acceptedTerms = false;
	let isSubmitting = false;
	let errorMessage = '';

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		if (isSubmitting) return;

		errorMessage = '';

		const trimmedName = name.trim();
		const trimmedEmail = email.trim();

		if (!trimmedName) {
			errorMessage = 'Name is required.';
			return;
		}

		if (!trimmedEmail) {
			errorMessage = 'Email is required.';
			return;
		}

		if (!passwordPattern.test(password)) {
			errorMessage = passwordRequirement;
			return;
		}

		if (!acceptedTerms) {
			errorMessage = 'You must accept the terms and privacy policy to continue.';
			return;
		}

		isSubmitting = true;

		try {
			const { data, error } = await supabase.auth.signUp({
				email: trimmedEmail,
				password,
				options: {
					data: {
						full_name: trimmedName
					}
				}
			});

			if (error) {
				errorMessage = error.message;
				return;
			}

			if (!data.session) {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email: trimmedEmail,
					password
				});

				if (signInError) {
					errorMessage = signInError.message;
					return;
				}
			}

			await goto(resolve('/'));
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
					<Label for="name">Name</Label>
					<Input
						id="name"
						name="name"
						type="text"
						placeholder="Jane Doe"
						bind:value={name}
						autocomplete="name"
						required
					/>
				</div>
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
				{/if}
				<div class="flex items-start gap-3 text-sm leading-tight text-muted-foreground">
					<input
						id="terms"
						name="terms"
						type="checkbox"
						bind:checked={acceptedTerms}
						class="mt-1 h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
						required
					/>
					<Label for="terms" class="cursor-pointer text-left font-normal">
						I agree to the
						<a
							class="text-primary underline"
							href={resolve('/terms')}
							target="_blank"
							rel="noreferrer"
						>
							Terms of Service
						</a>
						and
						<a
							class="text-primary underline"
							href={resolve('/privacy')}
							target="_blank"
							rel="noreferrer"
						>
							Privacy Policy
						</a>
						.
					</Label>
				</div>
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
