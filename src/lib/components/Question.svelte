<script lang="ts">
	import { t } from '$lib';

	export let name: string;
	export let question: string;
	export let description: string;
	export let placeholder: string;
	export let value: string = '';

	let hintId: string;
	$: hintId = `${name}-hint`;
</script>

<label for={name}>{$t(question)}</label>
<p id={hintId}>{$t(description)}</p>
<input
	id={name}
	{name}
	type="text"
	aria-describedby={hintId}
	placeholder={$t(placeholder)}
	bind:value
/>
