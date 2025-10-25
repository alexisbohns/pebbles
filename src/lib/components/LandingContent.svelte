<script lang="ts">
	import { t } from '$lib';
	import Logo from '$lib/components/Logo.svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';

	const loginPath = '/login' as const;
	const loginHref = resolve(loginPath);

	let { titleKey = 'landing.title', descriptionKey = 'landing.description' } = $props();

	const title = $derived.by(() => $t(titleKey));
	const description = $derived.by(() => $t(descriptionKey));
</script>

<section>
	<Logo alt={$t('home.title')} size="xl" name={false} />
	<h1 class="text-5xl">{title}</h1>
	<p class="text-xl mb-5">{description}</p>
	<Button href={loginHref} title={$t('common.get_started')}>
		{$t('common.get_started')}
	</Button>
</section>
