<script lang="ts">
	import { t } from '$lib';
	import { tick } from 'svelte';

	export let name: string;
	export let question: string;
	export let description: string;
	export let placeholder: string;
	export let value: string = '';
	export let required = false;
	export let autofocus = false;

	let hintId: string;
	let textareaElement: HTMLTextAreaElement | null = null;
	$: hintId = `${name}-hint`;

	const resizeTextarea = (textarea: HTMLTextAreaElement) => {
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	};

	function autoGrow(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		resizeTextarea(textarea);
	}

	const focusTextarea = async () => {
		if (!autofocus || !textareaElement) return;
		await tick();
		if (!textareaElement || !autofocus) return;
		textareaElement.focus();
		textareaElement.setSelectionRange(textareaElement.value.length, textareaElement.value.length);
		resizeTextarea(textareaElement);
	};

	$: if (autofocus && textareaElement) {
		focusTextarea();
	}
</script>

<div class="question">
	<label for={name}>
		<h2 class="question-name">{$t(question)}</h2>
		<p class="question-description" id={hintId}>{$t(description)}</p>
	</label>
	<!-- svelte-ignore a11y-autofocus -->
	<textarea
		id={name}
		aria-describedby={hintId}
		placeholder={$t(placeholder)}
		rows="1"
		bind:this={textareaElement}
		bind:value
		on:input={autoGrow}
		{required}
		{autofocus}
	></textarea>
</div>

<style lang="postcss">
	.question {
		padding: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		opacity: 0.6;
	}

	.question-name {
		font-size: 1rem;
	}

	.question-description {
		font-size: 0.8rem;
		font-weight: 400;
		max-height: 0;
		opacity: 0;
		overflow: hidden;
		transition: all 0.5s ease;
		margin-top: 0.5rem;
	}

	.question:focus-within {
		opacity: 1;
	}

	.question:focus-within .question-description {
		max-height: 200px;
		opacity: 0.6;
	}

	.question textarea {
		width: 100%;
		background: transparent;
		border: none;
		border-left: 0 solid transparent;
		padding: 0;
		padding-left: 0;
		position: relative;
		resize: none;
		overflow: hidden;
		transition: all 0.25s ease;
	}

	.question textarea:focus {
		border: none;
		outline: none;
	}
</style>
