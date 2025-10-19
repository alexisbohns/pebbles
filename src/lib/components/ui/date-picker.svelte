<script lang="ts">
	import { Calendar } from '$lib/components/ui/calendar';
	import { Button } from '$lib/components/ui/button';
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
		PopoverClose
	} from '$lib/components/ui/popover';
	import { cn } from '$lib/utils.js';
	import { CalendarIcon } from '@lucide/svelte';
	import { getLocalTimeZone, parseDate, today, type DateValue } from '@internationalized/date';

	const localTimeZone = getLocalTimeZone();

	function parseDateSafe(raw: string | null | undefined): DateValue | undefined {
		if (!raw) return undefined;
		try {
			return parseDate(raw);
		} catch {
			return undefined;
		}
	}

	let {
		value = $bindable(''),
		placeholderText = 'Pick a date',
		disabled = false,
		min = undefined as string | undefined,
		max = undefined as string | undefined,
		locale = undefined as string | undefined,
		class: className = '',
		initialFocus = true,
		calendarLabel = 'Select date',
		weekdayFormat = 'short' as Intl.DateTimeFormatOptions['weekday']
	} = $props();

	let open = $state(false);
	let internalValue = $state<DateValue | undefined>(parseDateSafe(value));
	let lastCommitSignature = '';

	$effect(() => {
		const parsed = parseDateSafe(value);
		if (!parsed && !value) {
			internalValue = undefined;
		} else if (parsed && parsed.toString() !== internalValue?.toString()) {
			internalValue = parsed;
		}
	});

	$effect(() => {
		value = internalValue ? internalValue.toString() : '';
	});

	const formatter = $derived.by(
		() =>
			new Intl.DateTimeFormat(locale, {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
	);

	const formattedValue = $derived.by(() =>
		internalValue ? formatter.format(internalValue.toDate(localTimeZone)) : placeholderText
	);

	const minValue = $derived.by(() => parseDateSafe(min));
	const maxValue = $derived.by(() => parseDateSafe(max));

	$effect(() => {
		const signature = internalValue?.toString() ?? '';
		if (open && signature && signature !== lastCommitSignature) {
			open = false;
		}
		lastCommitSignature = signature;
	});

	function handleSelect(date: DateValue | undefined) {
		internalValue = date;
	}

	function setToday() {
		internalValue = today(localTimeZone);
	}

	function clearValue() {
		internalValue = undefined;
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn(
					'w-full justify-start text-left font-normal',
					!internalValue && 'text-muted-foreground',
					className
				)}
				{disabled}
				type="button"
			>
				<CalendarIcon class="mr-2 size-4" />
				{#if internalValue}
					{formattedValue}
				{:else}
					<span>{placeholderText}</span>
				{/if}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-auto space-y-2 p-3" align="start">
		<Calendar
			type="single"
			{initialFocus}
			bind:value={internalValue}
			onValueChange={handleSelect}
			placeholder={internalValue}
			{minValue}
			{maxValue}
			{disabled}
			{calendarLabel}
			{weekdayFormat}
		/>
		<div class="flex items-center justify-between gap-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="text-muted-foreground"
				onclick={clearValue}
			>
				Clear
			</Button>
			<div class="flex gap-2">
				<Button type="button" variant="ghost" size="sm" onclick={setToday}>Today</Button>
				<PopoverClose>
					{#snippet child({ props })}
						<Button {...props} type="button" size="sm">Close</Button>
					{/snippet}
				</PopoverClose>
			</div>
		</div>
	</PopoverContent>
</Popover>
