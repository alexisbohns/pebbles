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

	return {
		profile
	};
};
