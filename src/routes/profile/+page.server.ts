import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type ActivityCount = {
	date: string;
	value: number;
};

export const load: PageServerLoad = async ({ locals }) => {
	const { user, supabase } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('full_name, avatar_url, role, created_at')
		.eq('id', user.id)
		.maybeSingle();

	if (profileError) {
		throw error(500, 'Unable to load profile');
	}

	const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

	const getMetadataValue = (...keys: string[]) => {
		for (const key of keys) {
			const value = metadata[key];
			if (typeof value === 'string' && value.trim().length > 0) {
				return value;
			}
		}
		return null;
	};

	const fallbackProfile = {
		full_name: getMetadataValue('full_name', 'full-name', 'name') ?? user.email ?? null,
		avatar_url:
			getMetadataValue('avatar_url', 'avatar', 'picture', 'image') ??
			user.user_metadata?.avatar_url ??
			null,
		role: getMetadataValue('role', 'user_role'),
		created_at: profile?.created_at ?? user.created_at ?? null
	};

	const resolvedProfile = profile ?? fallbackProfile;

	const hasProfileInfo = Boolean(
		resolvedProfile?.full_name ??
			resolvedProfile?.avatar_url ??
				resolvedProfile?.role ??
				resolvedProfile?.created_at
	);

	let activityCounts: ActivityCount[] = [];

	const { data: activityProjection, error: activityError } = await supabase
		.from('event_activity_projection')
		.select('created_activity')
		.eq('profile_id', user.id)
		.maybeSingle();

	if (!activityError && activityProjection?.created_activity && Array.isArray(activityProjection.created_activity)) {
		activityCounts = activityProjection.created_activity.flatMap((entry) => {
			if (!entry || typeof entry !== 'object') {
				return [];
			}

			const { date, value } = entry as Record<string, unknown>;

			return typeof date === 'string' && typeof value === 'number'
				? [{ date, value }]
				: [];
		});
	}

	activityCounts.sort((a, b) => a.date.localeCompare(b.date));

	return {
		profile: resolvedProfile,
		hasProfileInfo,
		activityCounts
	};
};
