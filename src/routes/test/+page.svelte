<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const { user } = data;
</script>

<h1>Supabase Test</h1>

{#if user}
	<p>Signed in as {user.email}</p>
{:else}
	<p>No active Supabase session.</p>
{/if}
