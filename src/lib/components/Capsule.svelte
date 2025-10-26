<script lang="ts">
	export let capsuleLabel: string = '';
	export let time: string = '';
	export let datetime: string = time;
</script>

<div class="flex items-center gap-2 rounded-xl border pe-2">
	{#if capsuleLabel}
		<span class="rounded-xl bg-muted px-2 py-1 text-xs font-[500] text-muted-foreground">
			{capsuleLabel}
		</span>
	{/if}
	{#if time}
		<time {datetime} class="text-xs text-muted-foreground">
			{time}
		</time>
	{/if}
</div>
