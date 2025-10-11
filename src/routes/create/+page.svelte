<script lang="ts">
	const createLinks = [
		{ href: '/create/analyse', label: 'Analyse' },
		{ href: '/create/moment', label: 'Moment' },
		{ href: '/create/decision', label: 'Decision' },
		{ href: '/create/mood', label: 'Mood' },
		{ href: '/create/achievement', label: 'Achievement' },
		{ href: '/create/gratitude', label: 'Gratitude' },
		{ href: '/create/thought', label: 'Thought' }
	];
</script>

<h1>Create</h1>

<ul>
	{#each createLinks as link}
		<li>
			<a href={link.href}>{link.label}</a>
		</li>
	{/each}
</ul>
