<script lang="ts">
	import placeholderAvatar from '$lib/assets/placeholder.png';
	import * as Calendar from '$lib/components/ui/calendar/index.js';
	import { cn } from '$lib/utils.js';
	import {
		CalendarDate,
		getLocalTimeZone,
		parseDate,
		today,
		type DateValue
	} from '@internationalized/date';

	type ActivityCount = {
		date: string;
		value: number;
	};

	let { data } = $props();
	const profile = data.profile;
	const hasProfileInfo = data.hasProfileInfo;
	const activityCounts: ActivityCount[] = data.activityCounts ?? [];

	const highlightedDates = new Set(activityCounts.map((entry) => entry.date));

	const getInitialDate = () => {
		const fallback = today(getLocalTimeZone());
		const latestActivity = activityCounts.at(-1);

		if (!latestActivity) {
			return fallback;
		}

		try {
			return parseDate(latestActivity.date);
		} catch {
			return fallback;
		}
	};

	let value = $state<CalendarDate | undefined>(getInitialDate());

	const hasActivityOn = (date: DateValue) => highlightedDates.has(date.toString());

	const dayClass = (date: DateValue) =>
		cn(
			'transition-colors',
			hasActivityOn(date) && 'bg-muted text-primary font-bold ring-1 ring-muted-foreground'
		);

	const handleAvatarError = (event: Event) => {
		const target = event.currentTarget as HTMLImageElement | null;

		if (!target || target.dataset.fallbackApplied === 'true') {
			return;
		}

		target.dataset.fallbackApplied = 'true';
		target.src = placeholderAvatar;
	};
</script>

{#if profile && hasProfileInfo}
	<header class="mb-6 flex flex-col items-center gap-2">
		{#if profile.avatar_url}
			<img
				src={profile.avatar_url}
				alt={`Profile picture of ${profile.full_name ?? 'user'}`}
				width="120"
				height="120"
				onerror={handleAvatarError}
				class="rounded-full"
			/>
		{/if}
		<h1 class="mb-0">
			{#if profile.full_name != null}
				{profile.full_name}
			{:else}
				User Profile
			{/if}
		</h1>

		<p class="text-muted-foreground text-sm">
			<strong>Created at ·</strong>
			{profile.created_at ? new Date(profile.created_at).toLocaleString() : '—'}
		</p>
	</header>
{:else}
	<p>No profile information available.</p>
{/if}

{#if activityCounts.length > 0}
	<section class="mt-8 space-y-3">
		<h2 class="text-lg font-semibold">Activity Calendar</h2>

		<Calendar.Calendar type="single" bind:value numberOfMonths={1}>
			{#snippet child({ months, weekdays })}
				<Calendar.Header>
					<Calendar.PrevButton />
					<Calendar.Heading />
					<Calendar.NextButton />
				</Calendar.Header>

				<Calendar.Months>
					{#each months as month (month)}
						<Calendar.Grid>
							<Calendar.GridHead>
								<Calendar.GridRow class="flex">
									{#each weekdays as weekday (weekday)}
										<Calendar.HeadCell>
											{weekday.slice(0, 2)}
										</Calendar.HeadCell>
									{/each}
								</Calendar.GridRow>
							</Calendar.GridHead>

							<Calendar.GridBody>
								{#each month.weeks as weekDates (weekDates)}
									<Calendar.GridRow class="mt-2 w-full">
										{#each weekDates as date (date)}
											<Calendar.Cell {date} month={month.value}>
												<Calendar.Day class={dayClass(date)} />
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							</Calendar.GridBody>
						</Calendar.Grid>
					{/each}
				</Calendar.Months>
			{/snippet}
		</Calendar.Calendar>
	</section>
{:else}
	<p class="mt-8 text-sm text-muted-foreground">No recent activity yet.</p>
{/if}
