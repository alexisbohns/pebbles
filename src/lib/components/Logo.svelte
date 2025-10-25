<script lang="ts">
	import logoSvg from '$lib/assets/pebblestones_logo.svg?raw';
	import nameSvg from '$lib/assets/pebblestones_name.svg?raw';

	type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

	const SIZE_MAP: Record<LogoSize, string> = {
		sm: '1rem',
		md: '2rem',
		lg: '3rem',
		xl: '4rem'
	};

	const NAME_ASPECT_RATIO = 857 / 122;

	export let alt: string = 'Pebblestones';
	export let size: LogoSize = 'md';
	export let icon = true;
	export let name = true;

	const normalizedSvg = (svg: string) =>
		svg
			.replace('width="800"', 'width="100%"')
			.replace('height="800"', 'height="100%"')
			.replace('width="857"', 'width="100%"')
			.replace('height="122"', 'height="100%"')
			.replace('<svg ', '<svg aria-hidden="true" focusable="false" role="presentation" ');

	const faviconMarkup = normalizedSvg(logoSvg);
	const nameMarkup = normalizedSvg(nameSvg);

	let height = SIZE_MAP[size] ?? SIZE_MAP.md;
	let nameWidth = `calc(${height} * ${NAME_ASPECT_RATIO.toFixed(4)})`;

	$: height = SIZE_MAP[size] ?? SIZE_MAP.md;
	$: nameWidth = `calc(${height} * ${NAME_ASPECT_RATIO.toFixed(4)})`;
	$: showLogo = icon || name;
</script>

{#if showLogo}
	<span class="logo" role="img" aria-label={alt}>
		{#if icon}
			<span class="logo-icon" style={`height:${height};width:${height};`}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html faviconMarkup}
			</span>
		{/if}

		{#if name}
			<span class="logo-name" style={`height:${height};width:calc(${nameWidth}*0.45);`}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html nameMarkup}
			</span>
		{/if}
	</span>
{/if}

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.logo-icon,
	.logo-name {
		display: inline-flex;
	}

	.logo-icon :global(svg),
	.logo-name :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
