<script lang="ts">
	import { t } from '$lib';

	let { titleKey = 'landing.title', descriptionKey = 'landing.description' } = $props();

	const title = $derived.by(() => $t(titleKey));
	const description = $derived.by(() => $t(descriptionKey));
</script>

<section>
	<h1>{title}</h1>
	<p>{description}</p>
</section>
