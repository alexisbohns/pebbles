<script lang="ts">
	let { data } = $props();
</script>

<h1>Dashboard</h1>

{#if data.user}
	<p>Signed in as {data.user.email}</p>
{/if}
