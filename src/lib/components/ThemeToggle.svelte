<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/themeStore';

	const getLabel = (current: 'light' | 'dark') =>
		`Switch to ${current === 'dark' ? 'light' : 'dark'} mode`;
</script>

<button class="theme-toggle" type="button" aria-label={getLabel($theme)} on:click={toggleTheme}>
	<span aria-hidden="true">{$theme === 'dark' ? '🌻' : '🌙'}</span>
	<span>{$theme === 'dark' ? 'Light' : 'Dark'}</span>
</button>

<style lang="stylus">
	.theme-toggle
		border none
		background none
		color var(--a05)
</style>
