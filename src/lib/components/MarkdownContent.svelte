<script lang="ts">
	import Inline from './MarkdownInline.svelte';
	import type { Token, Tokens } from 'marked';

	export let tokens: Token[] = [];
</script>

{#each tokens as token, index (token.raw ?? `${token.type}-${index}`)}
	{#if token.type === 'heading'}
		{@const heading = token as Tokens.Heading}
		{#if heading.depth === 1}
			<h1><Inline tokens={heading.tokens} /></h1>
		{:else if heading.depth === 2}
			<h2><Inline tokens={heading.tokens} /></h2>
		{:else if heading.depth === 3}
			<h3><Inline tokens={heading.tokens} /></h3>
		{:else}
			<h4><Inline tokens={heading.tokens} /></h4>
		{/if}
	{:else if token.type === 'paragraph'}
		{@const paragraph = token as Tokens.Paragraph}
		<p><Inline tokens={paragraph.tokens} /></p>
	{:else if token.type === 'list'}
		{@const list = token as Tokens.List}
		{#if list.ordered}
			<ol>
				{#each list.items as item, itemIndex (item.raw ?? `${itemIndex}`)}
					{@const listItem = item as Tokens.ListItem}
					<li>
						<Inline tokens={listItem.tokens} />
					</li>
				{/each}
			</ol>
		{:else}
			<ul>
				{#each list.items as item, itemIndex (item.raw ?? `${itemIndex}`)}
					{@const listItem = item as Tokens.ListItem}
					<li>
						<Inline tokens={listItem.tokens} />
					</li>
				{/each}
			</ul>
		{/if}
	{:else if token.type === 'blockquote'}
		{@const blockquote = token as Tokens.Blockquote}
		<blockquote>
			<svelte:self tokens={blockquote.tokens} />
		</blockquote>
	{:else if token.type === 'code'}
		{@const code = token as Tokens.Code}
		<pre><code>{code.text}</code></pre>
	{:else if token.type === 'table'}
		{@const table = token as Tokens.Table}
		<table>
			<thead>
				<tr>
					{#each table.header as header, headerIndex (`header-${headerIndex}`)}
						<th><Inline tokens={header.tokens} /></th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each table.rows as row, rowIndex (`row-${rowIndex}`)}
					<tr>
						{#each row as cell, cellIndex (`cell-${cellIndex}`)}
							<td><Inline tokens={cell.tokens} /></td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{:else if token.type === 'space'}
		<!-- skip whitespace tokens -->
	{:else}
		{@const generic = token as Tokens.Generic}
		<p><Inline tokens={generic.tokens ?? []} /></p>
	{/if}
{/each}
