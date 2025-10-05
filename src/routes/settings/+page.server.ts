import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, supabase } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const authProvider =
		typeof user.app_metadata?.provider === 'string' ? user.app_metadata.provider : 'unknown';

	const { data: logs, error: logsError } = await supabase.rpc('get_user_audit_logs').limit(20);

	if (logsError) {
		console.error('Failed to fetch audit logs', logsError);
	}

	const timestampKeys = ['created_at', 'timestamp'];
	const eventKeys = ['event', 'action', 'type'];
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: '2-digit',
		minute: '2-digit'
	});

	const normalizeLogs = (
		entries: unknown[]
	): Array<{ date: string; time: string; event: string | null }> => {
		return entries.map((entry) => {
			if (!entry || typeof entry !== 'object') {
				return { date: '—', time: '—', event: null };
			}

			const record = entry as Record<string, unknown>;
			let timestamp: Date | null = null;
			for (const key of timestampKeys) {
				const raw = record[key];
				if (typeof raw === 'string' || raw instanceof Date) {
					const parsed = new Date(raw);
					if (!Number.isNaN(parsed.getTime())) {
						timestamp = parsed;
						break;
					}
				}
			}

			let event: string | null = null;
			for (const key of eventKeys) {
				const raw = record[key];
				if (typeof raw === 'string' && raw.trim().length > 0) {
					event = raw.trim();
					break;
				}
			}

			return {
				date: timestamp ? dateFormatter.format(timestamp) : '—',
				time: timestamp ? timeFormatter.format(timestamp) : '—',
				event
			};
		});
	};

	return {
		authProvider,
		logs: normalizeLogs(Array.isArray(logs) ? logs : [])
	};
};
