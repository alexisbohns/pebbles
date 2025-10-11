<script lang="ts">
	import { resolve } from '$app/paths';

	type CreateRoute =
		| '/create/analyse'
		| '/create/moment'
		| '/create/decision'
		| '/create/mood'
		| '/create/achievement'
		| '/create/gratitude'
		| '/create/thought';

	const createLinks = [
		{ href: '/create/analyse', label: 'Analyse' },
		{ href: '/create/moment', label: 'Moment' },
		{ href: '/create/decision', label: 'Decision' },
		{ href: '/create/mood', label: 'Mood' },
		{ href: '/create/achievement', label: 'Achievement' },
		{ href: '/create/gratitude', label: 'Gratitude' },
		{ href: '/create/thought', label: 'Thought' }
	] as const satisfies ReadonlyArray<{ href: CreateRoute; label: string }>;
</script>

<h1>Create</h1>

<ul>
	{#each createLinks as link (link.href)}
		<li>
			<a href={resolve(link.href)}>{link.label}</a>
		</li>
	{/each}
</ul>
