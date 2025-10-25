<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { supabase } from '$lib/supabaseClient';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { t } from '$lib';

	const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

	let passwordRequirement = '';
	let name = '';
	let email = '';
	let password = '';
	let acceptedTerms = false;
	let isSubmitting = false;
	let errorMessage = '';

	$: passwordRequirement = $t('auth.signup.password_hint');

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();

		if (isSubmitting) return;

		errorMessage = '';

		const trimmedName = name.trim();
		const trimmedEmail = email.trim();

		if (!trimmedName) {
			errorMessage = $t('auth.signup.errors.name_required');
			return;
		}

		if (!trimmedEmail) {
			errorMessage = $t('auth.signup.errors.email_required');
			return;
		}

		if (!passwordPattern.test(password)) {
			errorMessage = $t('auth.signup.errors.password_strength');
			return;
		}

		if (!acceptedTerms) {
			errorMessage = $t('auth.signup.errors.terms_required');
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
			const fallback = $t('auth.signup.errors.unexpected');
			const message = error instanceof Error ? error.message : fallback;
			errorMessage = message || fallback;
		} finally {
			isSubmitting = false;
		}
	};
</script>

<section class="flex flex-col w-full max-w-md mx-auto">
	<header class="space-y-1">
		<h1>{$t('auth.signup.heading')}</h1>
	</header>
	<div>
		<form class="flex flex-col gap-6" on:submit|preventDefault={handleSubmit}>
			<div>
				<Label for="name">{$t('auth.signup.fields.name')}</Label>
				<Input
					id="name"
					name="name"
					type="text"
					placeholder={$t('auth.signup.fields.name_placeholder')}
					bind:value={name}
					autocomplete="name"
					required
				/>
			</div>
			<div>
				<Label for="email">{$t('auth.signup.fields.email')}</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder={$t('auth.signup.fields.email_placeholder')}
					bind:value={email}
					autocomplete="email"
					required
				/>
			</div>
			<div>
				<Label for="password">{$t('auth.signup.fields.password')}</Label>
				<Input
					id="password"
					name="password"
					type="password"
					placeholder="••••••••"
					bind:value={password}
					autocomplete="new-password"
					required
				/>
				<p class="text-xs text-muted-foreground mt-2">{passwordRequirement}</p>
			</div>
			{#if errorMessage}
				<p class="text-sm font-medium text-destructive">{errorMessage}</p>
			{/if}
			<div class="flex items-start gap-3">
				<input
					id="terms"
					name="terms"
					type="checkbox"
					bind:checked={acceptedTerms}
					class="mt-1 h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
					required
				/>
				<Label for="terms" class="inline-flex flex-wrap items-center gap-1 text-left font-normal">
					<span>{$t('auth.signup.agreements.prefix')}</span>
					<a
						class="text-primary underline"
						href={resolve('/terms')}
						target="_blank"
						rel="noreferrer"
					>
						{$t('auth.signup.agreements.terms')}
					</a>
					<span>{$t('auth.signup.agreements.conjunction')}</span>
					<a
						class="text-primary underline"
						href={resolve('/privacy')}
						target="_blank"
						rel="noreferrer"
					>
						{$t('auth.signup.agreements.privacy')}
					</a>
					<span>{$t('auth.signup.agreements.suffix')}</span>
				</Label>
			</div>
			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{#if isSubmitting}
					{$t('auth.signup.submitting')}
				{:else}
					{$t('auth.signup.submit')}
				{/if}
			</Button>
		</form>
	</div>
	<Button variant="link" href={resolve('/login')} class="mt-6">
		{$t('auth.signup.footer.action')}
	</Button>
</section>
