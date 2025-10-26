<script lang="ts">
	import { resolve } from '$app/paths';
	import type { EventSummary } from '$lib/types/events';
	import { t } from '$lib';
	import Focus from '@lucide/svelte/icons/focus';
	import Calendar1 from '@lucide/svelte/icons/calendar-1';
	import Capsule from './Capsule.svelte';
	import { Activity } from '@lucide/svelte';

	let { event }: { event: EventSummary } = $props();

	const fallbackTitle = $derived.by(() =>
		$t('timeline.item.fallback_title', { id: (event?.id ?? '').slice(0, 8) })
	);
	const title = $derived.by(() => {
		const name = typeof event?.name === 'string' ? event.name.trim() : '';
		if (name.length > 0) return name;

		const kind = typeof event?.kind === 'string' ? event.kind.trim() : '';
		if (kind.length > 0) return kind;

		return fallbackTitle;
	});
	const occurrenceDate = $derived.by(() => {
		const value = typeof event?.occurrence_date === 'string' ? event.occurrence_date.trim() : '';
		return value.length > 0 ? value : null;
	});
	const valence = $derived.by(() =>
		typeof event?.valence === 'number' && Number.isFinite(event.valence) ? event.valence : null
	);
	const valenceLabel = $derived.by(() =>
		valence !== null ? $t('timeline.item.valence', { value: valence }) : null
	);
</script>

<article class="flex gap-4 items-center timeline-item timeline-item-{event.kind}">
	<div class="timeline-item-line">
		{#if event.kind == 'day'}
			<Calendar1 class="h-[1.2rem] w-[1.2rem] text-primary" />
		{:else}
			<Focus class="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
		{/if}
	</div>
	<a
		href={resolve('/events/[id]', { id: event?.id ?? '' })}
		class="flex flex-col items-start gap-2 pb-5 grow"
	>
		{#if occurrenceDate && event.kind != null}
			<Capsule capsuleLabel={event.kind} time={occurrenceDate} datetime={occurrenceDate} />
		{/if}
		<div class="flex gap-3 w-full">
			<div class="flex flex-col gap-1 grow">
				<h3 class="font-semibold">
					{title}
				</h3>
				{#if typeof event.description === 'string' && event.description.trim().length > 0}
					<p>{event.description}</p>
				{/if}
			</div>
			{#if valence !== null}
				<span aria-label={valenceLabel} class="flex text-xs items-center gap-1">
					<Activity
						size="12"
						color={valence > 0 ? 'rgba(var(--primary))' : valence == 0 ? 'slategray' : 'sienna'}
					/>
					{valence}
				</span>
			{/if}
		</div>
	</a>
</article>

<style lang="postcss">
	.timeline-item:hover a {
		opacity: 0.7;
	}

	.timeline-item-line {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: stretch;
		align-self: stretch;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.timeline-item-line::after {
		content: ' ';
		width: 3px;
		flex-grow: 1;
		background: var(--foreground-color);
		opacity: 0.1;
		border-radius: 10rem 10rem 0 0;
	}

	.timeline-item:last-child .timeline-item-line::after {
		visibility: hidden;
	}
</style>
