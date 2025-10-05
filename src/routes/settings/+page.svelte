<script lang="ts">
	import { t } from '$lib';

	type SecurityLog = {
		date: string;
		time: string;
		event: string | null;
		eventKey: string | null;
	};

	let { data } = $props();
	const authProvider: string = data.authProvider;
	const logs: SecurityLog[] = data.logs ?? [];
	const fallbackEventLabelKey = 'pages.settings.security.unknown_action';

	const resolveEventLabel = (log: SecurityLog): string => {
		const translated = log.eventKey ? $t(log.eventKey) : null;
		if (translated && translated !== log.eventKey) {
			return translated;
		}

		if (log.event && log.event.trim().length > 0) {
			return log.event;
		}

		return $t(fallbackEventLabelKey);
	};
</script>

<h1>{$t('pages.settings.title')}</h1>

<section>
	<h2>{$t('pages.settings.account.title')}</h2>
	<p>{$t('pages.settings.account.provider', { provider: authProvider })}</p>
</section>

<section>
	<h2>{$t('pages.settings.security.title')}</h2>
	{#if logs.length > 0}
		<ul>
			{#each logs as log, index (index)}
				<li>
					<p>
						{$t('pages.settings.security.entry', {
							date: log.date,
							time: log.time,
							event: resolveEventLabel(log)
						})}
					</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p>{$t('pages.settings.security.empty')}</p>
	{/if}
</section>
