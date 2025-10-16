<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const event = data.event;

	const kindLabel = $derived.by(() => {
		const kind = typeof event?.kind === 'string' ? event.kind.trim() : '';
		return kind.length > 0 ? $t('events.detail.kind_title', { kind }) : null;
	});
	const title = $derived.by(() => {
		const name = typeof event?.name === 'string' ? event.name.trim() : '';
		if (name.length > 0) return name;

		return kindLabel ?? $t('events.detail.title_fallback');
	});
	const backLabel = $derived($t('events.detail.back_to_list'));
</script>

<nav>
	<a href={resolve('/')}>{backLabel}</a>
</nav>

<section>
	<h1>{title}</h1>
	<pre>{JSON.stringify(event ?? {}, null, 2)}</pre>
</section>
