<script lang="ts">
	import { t } from '$lib';

	export let name: string;
	export let question: string;
	export let description: string;
	export let placeholder: string;
	export let value: string = '';

	let hintId: string;
	$: hintId = `${name}-hint`;

	function autoGrow(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	}
</script>

<div class="question">
	<label for={name}>
		<h2 class="question-name">{$t(question)}</h2>
		<p class="question-description" id={hintId}>{$t(description)}</p>
	</label>
	<textarea
		id={name}
		aria-describedby={hintId}
		placeholder={$t(placeholder)}
		rows="1"
		bind:value
		on:input={autoGrow}
	></textarea>
</div>

<style lang="stylus">
	.question
		padding 2rem
		display flex
		flex-direction column
		gap 1rem

		&-name
			font-size 1.2rem
			opacity 0.5

		&-description
			font-size 0.8rem
			font-weight 500
			max-height 0
			opacity 0
			overflow hidden
			transition all 0.5s ease
			margin-top 0.5rem
			
		&:focus-within &-name
			opacity 1
		&:focus-within &-description
			max-height 200px
			opacity 1
		
		textarea
			width 100%
			background transparent
			border none
			font-size 1rem
			padding 0.5rem 0.5rem 0.5rem 0
			font-family 'Alegreya'
			position relative
			resize none
			overflow hidden
			caret-color var(--mauve-light)

			&:focus
				border none
				border-right 3px solid var(--mauve-light)
				outline none
</style>
