import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

	return {
		profile: resolvedProfile,
		hasProfileInfo
	};
};
