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
		gap 0.5rem
		opacity 0.5

		&-name
			font-size 1.2rem

		&-description
			font-size 0.8rem
			font-weight 400
			max-height 0
			opacity 0
			overflow hidden
			transition all 0.5s ease
			margin-top 0.5rem
			color var(--wood-primary)
			
		&:focus-within
			opacity 1
		&:focus-within &-description
			max-height 200px
			opacity 1
		
		textarea
			width 100%
			background transparent
			border none
			border-left 0 solid transparent
			font-size 1.1rem
			padding 0
			padding-left 0
			font-family 'Alegreya'
			position relative
			resize none
			overflow hidden
			caret-color var(--mauve-light)
			transition all 0.25s ease

			&:focus
				border none
				border-left 3px solid var(--mauve-light)
				padding-left 0.5rem
				outline none
</style>
