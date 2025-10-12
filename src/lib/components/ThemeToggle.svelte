<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/themeStore';

	const getLabel = (current: 'light' | 'dark') =>
		`Switch to ${current === 'dark' ? 'light' : 'dark'} mode`;
</script>

<button
	class="theme-toggle {$theme}"
	type="button"
	aria-label={getLabel($theme)}
	on:click={toggleTheme}
>
	<span aria-hidden="true">{$theme === 'dark' ? '🌞' : '🌚'}</span>
</button>

<style lang="stylus">
	.theme-toggle
		border none
		background none
		color var(--a05)
		padding 0
		cursor pointer
		transition var(--trans-m)

		&.light
			transform rotate(0deg)

		&.dark
			transform rotate(360deg)
</style>
