<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Token, Tokens } from 'marked';

	export let tokens: Token[] = [];

	const isInternalLink = (href?: string) => !!href && href.startsWith('/');

	const keyForToken = (token: Token, index: number) => {
		const raw = (token as { raw?: string }).raw;
		if (typeof raw === 'string' && raw.trim().length > 0) {
			return `${index}-${raw}`;
		}
		return `${token.type}-${index}`;
	};
</script>

{#each tokens as token, index (keyForToken(token, index))}
	{#if token.type === 'text'}
		{@const text = token as Tokens.Text}
		{text.raw ?? text.text}
	{:else if token.type === 'strong'}
		{@const strong = token as Tokens.Strong}
		<strong><svelte:self tokens={strong.tokens} /></strong>
	{:else if token.type === 'em'}
		{@const emphasis = token as Tokens.Em}
		<em><svelte:self tokens={emphasis.tokens} /></em>
	{:else if token.type === 'codespan'}
		{@const code = token as Tokens.Codespan}
		<code>{code.text}</code>
	{:else if token.type === 'br'}
		<br />
	{:else if token.type === 'link'}
		{@const link = token as Tokens.Link}
		{#if isInternalLink(link.href)}
			<a href={resolve(link.href as `/${string}`)}><svelte:self tokens={link.tokens} /></a>
		{:else}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={link.href} rel="noopener noreferrer" target="_blank">
				<svelte:self tokens={link.tokens} />
			</a>
		{/if}
	{:else if token.type === 'escape'}
		{@const escape = token as Tokens.Escape}
		{escape.text}
	{:else if token.type === 'image'}
		{@const image = token as Tokens.Image}
		<img src={image.href} alt={image.text} />
	{:else}
		{token.raw ?? ''}
	{/if}
{/each}
