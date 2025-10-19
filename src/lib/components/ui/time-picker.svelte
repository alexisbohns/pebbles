<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
		PopoverClose,
	} from "$lib/components/ui/popover";
	import { cn } from "$lib/utils.js";
	import { Clock } from "@lucide/svelte";

	type TimeParts = { hour: number; minute: number };

	const clamp = (value: number, min: number, max: number) =>
		Math.max(min, Math.min(max, value));
	const pad = (value: number) => String(value).padStart(2, "0");

	function parseTime(raw: string | null | undefined): TimeParts | null {
		if (!raw) return null;
		const [rawHour, rawMinute] = raw.split(":");
		const hour = Number.parseInt(rawHour ?? "", 10);
		const minute = Number.parseInt(rawMinute ?? "", 10);
		if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
		if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
		return { hour, minute };
	}

	function formatTime(parts: TimeParts): string {
		return `${pad(parts.hour)}:${pad(parts.minute)}`;
	}

	let {
	value = $bindable(""),
	placeholderText = "Pick a time",
	disabled = false,
	stepMinutes = 5,
	class: className = "",
} = $props();

const now = new Date();
let initialHour = now.getHours();
let initialMinute = Math.round(now.getMinutes() / stepMinutes) * stepMinutes;
if (initialMinute >= 60) {
	initialMinute = 0;
	initialHour = (initialHour + 1) % 24;
}

let open = $state(false);
let internalHour = $state(initialHour);
let internalMinute = $state(initialMinute);

let lastValueSignature = value;

$effect(() => {
	if (value === lastValueSignature) return;
	lastValueSignature = value;
	const parsed = parseTime(value);
	if (!parsed) return;
	internalHour = parsed.hour;
	internalMinute = parsed.minute;
});

	function commit(parts: TimeParts) {
		const normalizedMinute = Math.round(parts.minute / stepMinutes) * stepMinutes;
		const clampedMinute = normalizedMinute >= 60 ? 0 : normalizedMinute;
		const deltaHour = normalizedMinute >= 60 ? 1 : 0;
		internalHour = (parts.hour + deltaHour + 24) % 24;
		internalMinute = clamp(clampedMinute, 0, 59);
		const nextValue = formatTime({ hour: internalHour, minute: internalMinute });
		value = nextValue;
		lastValueSignature = nextValue;
	}

	function incrementHour() {
		commit({ hour: (internalHour + 1) % 24, minute: internalMinute });
	}

	function decrementHour() {
		commit({ hour: (internalHour + 23) % 24, minute: internalMinute });
	}

	function incrementMinute() {
		let nextMinute = internalMinute + stepMinutes;
		let nextHour = internalHour;
		if (nextMinute >= 60) {
			nextMinute -= 60;
			nextHour = (nextHour + 1) % 24;
		}
		commit({ hour: nextHour, minute: nextMinute });
	}

	function decrementMinute() {
		let nextMinute = internalMinute - stepMinutes;
		let nextHour = internalHour;
		if (nextMinute < 0) {
			nextMinute = 60 + nextMinute;
			nextHour = (nextHour + 23) % 24;
		}
		commit({ hour: nextHour, minute: nextMinute });
	}

	function clearValue() {
		value = "";
		lastValueSignature = "";
	}

	function applyCurrentTime() {
		const current = new Date();
		commit({
			hour: current.getHours(),
			minute: current.getMinutes(),
		});
	}

	function handleTimeInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement | null;
		if (!target) return;
		const parsed = parseTime(target.value);
		if (!parsed) {
			value = target.value;
			lastValueSignature = target.value;
			return;
		}
		commit(parsed);
	}

const displayValue = $derived.by(() => {
	if (!value) return placeholderText;
	const parsed = parseTime(value);
	if (!parsed) return placeholderText;
	return formatTime(parsed);
});
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class={cn(
					"w-full justify-start text-left font-normal",
					!value && "text-muted-foreground",
					className,
				)}
				disabled={disabled}
				type="button"
			>
				<Clock class="mr-2 size-4" />
				{displayValue}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-[260px] space-y-4 p-4" align="start">
		<div class="grid gap-4">
			<div class="grid gap-2 text-center">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Hour
				</span>
				<div class="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={decrementHour}
					>
						-
					</Button>
					<span class="w-12 text-lg font-semibold tabular-nums">
						{pad(internalHour)}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={incrementHour}
					>
						+
					</Button>
				</div>
			</div>

			<div class="grid gap-2 text-center">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Minutes
				</span>
				<div class="flex items-center justify-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={decrementMinute}
					>
						-
					</Button>
					<span class="w-12 text-lg font-semibold tabular-nums">
						{pad(internalMinute)}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={incrementMinute}
					>
						+
					</Button>
				</div>
			</div>

			<div class="grid gap-2">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Manual entry
				</span>
			<Input
				type="time"
				step={stepMinutes * 60}
				value={value}
				oninput={handleTimeInput}
			/>
			</div>
		</div>

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
			<Button type="button" variant="outline" size="sm" onclick={applyCurrentTime}>
				Now
			</Button>
				<PopoverClose>
					{#snippet child({ props })}
						<Button {...props} type="button" size="sm">
							Done
						</Button>
					{/snippet}
				</PopoverClose>
			</div>
		</div>
	</PopoverContent>
</Popover>
