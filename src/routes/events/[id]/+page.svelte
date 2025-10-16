<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const event = data.event;
	const title =
		typeof event?.name === 'string' && event.name.trim().length > 0
			? event.name.trim()
			: typeof event?.kind === 'string' && event.kind
				? `${event.kind} event`
				: 'Event details';
</script>

<nav>
	<a href={resolve('/')}>Back to events</a>
</nav>

<section>
	<h1>{title}</h1>
	<pre>{JSON.stringify(event ?? {}, null, 2)}</pre>
</section>
