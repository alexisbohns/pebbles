<script lang="ts">
	import { t } from '$lib';

	export let name: string;
	export let question: string;
	export let description: string;
	export let placeholder: string;
	export let value: string = '';
	export let required = false;

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
		{required}
	></textarea>
</div>

<style lang="stylus">
	.question
		padding 1rem 0
		display flex
		flex-direction column
		gap 0.5rem
		opacity 0.6

		&-name
			font-size 1rem

		&-description
			font-size 0.8rem
			font-weight 400
			max-height 0
			opacity 0
			overflow hidden
			transition all 0.5s ease
			margin-top 0.5rem
			
		&:focus-within
			opacity 1
		&:focus-within &-description
			max-height 200px
			opacity 0.6
		
		textarea
			width 100%
			background transparent
			border none
			border-left 0 solid transparent
			font-size 1.1rem
			padding 0
			padding-left 0
			font-family var(--f-serif)
			color var(--e10)
			position relative
			resize none
			overflow hidden
			caret-color var(--a05)
			transition all 0.25s ease

			&::placeholder
				color var(--e10)
				opacity 0.3

			&:focus
				border none
				border-left 3px solid var(--a05)
				padding-left 0.5rem
				outline none
</style>
